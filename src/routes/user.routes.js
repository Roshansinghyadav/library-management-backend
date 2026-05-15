const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Validation rules
const createUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('role')
    .optional()
    .isIn(['Member', 'Admin', 'Librarian'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Suspended'])
    .withMessage('Invalid status'),
];

const idRule = [param('id').isMongoId().withMessage('Invalid user ID')];

// ── Routes ─────────────────────────────────────────────────────────────────
router.route('/')
  .get(protect, getUsers)
  .post(protect, createUserRules, validate, createUser);

router.route('/:id')
  .get(protect, idRule, validate, getUserById)
  .put(protect, idRule, validate, updateUser)
  .delete(protect, idRule, validate, deleteUser);

module.exports = router;
