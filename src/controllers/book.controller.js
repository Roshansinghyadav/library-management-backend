const Book = require('../models/Book.model');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all books (with optional search/filter/pagination)
// @route   GET /api/books
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getBooks = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      page = 1,
      limit = 100,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean({ virtuals: true }),
      Book.countDocuments(filter),
    ]);

    res.json({
      books,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).lean({ virtuals: true });
    if (!book) return res.status(404).json({ error: 'Book not found.' });
    res.json({ book });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a new book
// @route   POST /api/books
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const createBook = async (req, res, next) => {
  try {
    const bookData = {
      ...req.body,
      addedBy: req.admin?._id,
      availableCopies: req.body.totalCopies || 1,
    };

    const book = await Book.create(bookData);
    res.status(201).json({ message: 'Book added successfully.', book: book.toObject({ virtuals: true }) });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean({ virtuals: true });

    if (!book) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book updated successfully.', book });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found.' });
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all unique categories
// @route   GET /api/books/categories
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category');
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook, getCategories };
