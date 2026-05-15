const User = require('../models/User.model');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all library members
// @route   GET /api/users
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 100,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean({ virtuals: true }),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single user
// @route   GET /api/users/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean({ virtuals: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create library member
// @route   POST /api/users
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      message: 'Library member created successfully.',
      user: user.toObject({ virtuals: true }),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update library member
// @route   PUT /api/users/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean({ virtuals: true });

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete library member
// @route   DELETE /api/users/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
