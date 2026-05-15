const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: [150, 'Author name cannot exceed 150 characters'],
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Self-Help',
        'Children',
        'Art & Design',
        'Philosophy',
        'Religion',
        'Business',
        'Education',
        'Other',
      ],
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    publishedYear: {
      type: Number,
      min: [1000, 'Invalid year'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Must have at least 1 copy'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: [0, 'Available copies cannot be negative'],
      default: function () {
        return this.totalCopies;
      },
    },
    status: {
      type: String,
      enum: ['Available', 'Borrowed', 'Reserved', 'Lost'],
      default: 'Available',
    },
    coverImage: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    addedBy: {
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

// Virtual: id field (maps _id to id for frontend compatibility)
bookSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Auto-update status based on available copies
bookSchema.pre('save', function (next) {
  if (this.availableCopies === 0) {
    this.status = 'Borrowed';
  } else {
    this.status = 'Available';
  }
  next();
});

// Index for full-text search
bookSchema.index({ title: 'text', author: 'text', category: 'text' });
bookSchema.index({ status: 1 });
bookSchema.index({ category: 1 });

module.exports = mongoose.model('Book', bookSchema);
