const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    // Denormalized fields for quick display (no extra lookup needed)
    bookTitle: { type: String },
    bookIsbn: { type: String },
    userName: { type: String },
    userEmail: { type: String },
    memberId: { type: String },

    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Issued', 'Returned', 'Overdue'],
      default: 'Issued',
    },
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id
assignmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Auto-check overdue status
assignmentSchema.pre('save', function (next) {
  if (this.status === 'Issued' && this.dueDate < new Date()) {
    this.status = 'Overdue';
    // Fine calculation: ₹5 per day overdue
    const daysOverdue = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    this.fine = daysOverdue * 5;
  }
  next();
});

assignmentSchema.index({ status: 1 });
assignmentSchema.index({ user: 1 });
assignmentSchema.index({ book: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
