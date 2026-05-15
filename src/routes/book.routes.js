const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
} = require('../controllers/book.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Validation rules
const createBookRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('isbn').trim().notEmpty().withMessage('ISBN is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('totalCopies')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total copies must be a positive integer'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid published year'),
];

const idRule = [
  param('id').isMongoId().withMessage('Invalid book ID'),
];

// ── Routes ─────────────────────────────────────────────────────────────────
router.get('/categories', protect, getCategories);

router.route('/')
  .get(protect, getBooks)
  .post(protect, createBookRules, validate, createBook);

router.route('/:id')
  .get(protect, idRule, validate, getBookById)
  .put(protect, idRule, validate, updateBook)
  .delete(protect, idRule, validate, deleteBook);

module.exports = router;
