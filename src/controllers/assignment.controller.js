const Assignment = require('../models/Assignment.model');
const Book = require('../models/Book.model');
const User = require('../models/User.model');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getAssignments = async (req, res, next) => {
  try {
    const {
      search,
      status,
      page = 1,
      limit = 100,
      sortBy = 'issueDate',
      order = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { bookTitle: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { bookIsbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('book', 'title isbn coverImage')
        .populate('user', 'name email memberId')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean({ virtuals: true }),
      Assignment.countDocuments(filter),
    ]);

    res.json({
      assignments,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('book', 'title isbn author coverImage')
      .populate('user', 'name email memberId phone')
      .lean({ virtuals: true });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
    res.json({ assignment });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Issue a book to a member
// @route   POST /api/assignments
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const createAssignment = async (req, res, next) => {
  try {
    const { bookId, userId, dueDate, notes } = req.body;

    // Validate book availability
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: 'Book not found.' });
    if (book.availableCopies < 1) {
      return res.status(400).json({ error: 'No copies available for this book.' });
    }

    // Validate user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.status !== 'Active') {
      return res.status(400).json({ error: 'User account is not active.' });
    }

    // Create assignment with denormalized data
    const assignment = await Assignment.create({
      book: bookId,
      user: userId,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      userName: user.name,
      userEmail: user.email,
      memberId: user.memberId,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      notes,
      issuedBy: req.admin?._id,
    });

    // Decrement available copies
    book.availableCopies -= 1;
    await book.save();

    // Increment user's books issued count
    user.booksIssued = (user.booksIssued || 0) + 1;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'Book issued successfully.',
      assignment: assignment.toObject({ virtuals: true }),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Return a book (mark assignment as returned)
// @route   PUT /api/assignments/:id/return
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const returnBook = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    if (assignment.status === 'Returned') {
      return res.status(400).json({ error: 'Book already returned.' });
    }

    assignment.status = 'Returned';
    assignment.returnDate = new Date();
    await assignment.save();

    // Increment available copies
    await Book.findByIdAndUpdate(assignment.book, { $inc: { availableCopies: 1 } });

    res.json({ message: 'Book returned successfully.', assignment: assignment.toObject({ virtuals: true }) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete an assignment record
// @route   DELETE /api/assignments/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    // If still issued, restore the book copy
    if (assignment.status !== 'Returned') {
      await Book.findByIdAndUpdate(assignment.book, { $inc: { availableCopies: 1 } });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update an assignment record (due date, notes, etc.)
// @route   PATCH /api/assignments/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const updateAssignment = async (req, res, next) => {
  try {
    const { dueDate, notes, status } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    if (dueDate) assignment.dueDate = dueDate;
    if (notes !== undefined) assignment.notes = notes;
    if (status) assignment.status = status;

    await assignment.save();
    res.json({ message: 'Assignment updated successfully.', assignment: assignment.toObject({ virtuals: true }) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  returnBook,
  deleteAssignment,
  updateAssignment,
};
