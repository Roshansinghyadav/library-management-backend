const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  returnBook,
  deleteAssignment,
  updateAssignment,
} = require('../controllers/assignment.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Validation rules
const createAssignmentRules = [
  body('bookId').isMongoId().withMessage('Valid Book ID is required'),
  body('userId').isMongoId().withMessage('Valid User ID is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const updateAssignmentRules = [
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const idRule = [param('id').isMongoId().withMessage('Invalid assignment ID')];

// ── Routes ─────────────────────────────────────────────────────────────────
router.route('/')
  .get(protect, getAssignments)
  .post(protect, createAssignmentRules, validate, createAssignment);

router.route('/:id')
  .get(protect, idRule, validate, getAssignmentById)
  .patch(protect, idRule, updateAssignmentRules, validate, updateAssignment)
  .delete(protect, idRule, validate, deleteAssignment);

router.put('/:id/return', protect, idRule, validate, returnBook);

module.exports = router;
