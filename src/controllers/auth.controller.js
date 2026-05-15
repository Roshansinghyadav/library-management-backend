const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser.model');

/**
 * Generate a signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new admin
// @route   POST /api/auth/register
// @access  Public (first-time setup) | Protected in production
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const admin = await AdminUser.create({ name, email, password, role });

    const token = generateToken(admin._id);

    res.status(201).json({
      message: 'Admin registered successfully.',
      token,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact superadmin.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken(admin._id);

    res.json({
      message: 'Login successful.',
      token,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current logged-in admin profile
// @route   GET /api/auth/me
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const admin = await AdminUser.findById(req.admin._id);
    res.json({ admin });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update admin profile
// @route   PUT /api/auth/me
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'avatar'];
    const updates = {};
    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const admin = await AdminUser.findByIdAndUpdate(req.admin._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ message: 'Profile updated.', admin });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await AdminUser.findById(req.admin._id).select('+password');

    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    admin.password = newPassword;
    await admin.save();

    const token = generateToken(admin._id);
    res.json({ message: 'Password changed successfully.', token });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP to admin email for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const admin = await AdminUser.findOne({ email });
    if (!admin) return res.status(404).json({ error: 'No account found with this email address.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    admin.isOtpVerified = false;
    await admin.save({ validateBeforeSave: false });

    // Send email via nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LibPro System" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: 'Your Password Reset OTP — LibPro',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Password Reset Request</h2>
          <p style="color: #475569;">Hi <strong>${admin.name}</strong>,</p>
          <p style="color: #475569;">Use the OTP below to reset your LibPro admin password. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1e293b; background: #f1f5f9; padding: 16px 24px; border-radius: 12px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent successfully to your registered email.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const admin = await AdminUser.findOne({ email });
    if (!admin) return res.status(404).json({ error: 'No account found with this email.' });

    if (!admin.otp || admin.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    if (admin.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    admin.isOtpVerified = true;
    admin.otp = null;
    admin.otpExpiry = null;
    await admin.save({ validateBeforeSave: false });

    res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    const admin = await AdminUser.findOne({ email }).select('+password');
    if (!admin) return res.status(404).json({ error: 'No account found with this email.' });

    if (!admin.isOtpVerified) {
      return res.status(403).json({ error: 'OTP not verified. Please verify your email first.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    admin.password = newPassword;
    admin.isOtpVerified = false;
    await admin.save();

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, verifyOtp, resetPassword };
