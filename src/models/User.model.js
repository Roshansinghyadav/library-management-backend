const mongoose = require('mongoose');

const memberUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    memberId: {
      type: String,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Member', 'Admin', 'Librarian'],
      default: 'Member',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    booksIssued: {
      type: Number,
      default: 0,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id
memberUserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Auto-generate memberId before saving
memberUserSchema.pre('save', async function (next) {
  if (!this.memberId) {
    const count = await mongoose.model('User').countDocuments();
    this.memberId = `LMS${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

memberUserSchema.index({ status: 1 });

module.exports = mongoose.model('User', memberUserSchema);
