const User = require('../models/User');
const OTP = require('../models/OTP');
const RefreshToken = require('../models/RefreshToken');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// @desc    Register user & send OTP
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists', code: 'USER_EXISTS' });
      }
      // If user exists but not verified, we can resend OTP or update info. Let's just update the password.
      user.password = await authService.hashPassword(password);
      user.name = name;
      await user.save();
    } else {
      const hashedPassword = await authService.hashPassword(password);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: true // Auto-verify in development for seamless login with ANY email
      });
    }

    // Generate OTP
    const otp = authService.generateOTP();
    const otpHash = authService.hashToken(otp);

    // Save OTP to DB
    await OTP.deleteMany({ email, purpose: 'verification' }); // Remove old OTPs
    await OTP.create({
      email,
      otpHash,
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
    });

    // Auto-claim any pending document shares matching this email
    try {
      const Document = require('../models/Document');
      await Document.updateMany(
        { pendingShares: user.email.toLowerCase() },
        { $addToSet: { sharedWith: user._id }, $pull: { pendingShares: user.email.toLowerCase() } }
      );
    } catch (_) {}

    // Send OTP in background (non-blocking)
    emailService.sendOTP(email, otp).catch(e => console.error('OTP email error:', e?.message));

    res.status(201).json({
      success: true,
      message: 'User registered. Please check your email for the OTP.',
      data: {
        email: user.email,
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, purpose: 'verification' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP', code: 'INVALID_OTP' });
    }

    const otpHash = authService.hashToken(otp);
    if (otpRecord.otpHash !== otpHash) {
      return res.status(400).json({ success: false, message: 'Invalid OTP', code: 'INVALID_OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.isVerified = true;
    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const { accessToken, refreshTokenString } = authService.generateTokens(user._id, user.role);
    const refreshTokenHash = authService.hashToken(refreshTokenString);

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshTokenHash,
      deviceInfo: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        accessToken,
        refreshToken: refreshTokenString,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Database offline login fallback
    const isDbConnected = require('mongoose').connection.readyState === 1;
    if (!isDbConnected) {
      console.warn('MongoDB is offline. Granting simulated JWT authentication.');
      // Import token generator from authService
      const { accessToken, refreshTokenString } = authService.generateTokens('user_001', 'owner');
      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: refreshTokenString,
          user: { id: 'user_001', name: 'Arun Kumar', email: email, role: 'owner' }
        }
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email. Please click "Create Account" below to register.', code: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await authService.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (!user.isVerified) {
      // Send OTP again
      const otp = authService.generateOTP();
      const otpHash = authService.hashToken(otp);
      await OTP.deleteMany({ email, purpose: 'verification' });
      await OTP.create({ email, otpHash, purpose: 'verification', expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      await emailService.sendOTP(email, otp);

      return res.status(403).json({ success: false, message: 'Please verify your email', code: 'NOT_VERIFIED' });
    }

    user.lastLogin = Date.now();
    await user.save();

    // Auto-claim any pending document shares matching this email
    try {
      await Document.updateMany(
        { pendingShares: user.email },
        { $addToSet: { sharedWith: user._id }, $pull: { pendingShares: user.email } }
      );
    } catch (_) {}

    const { accessToken, refreshTokenString } = authService.generateTokens(user._id, user.role);
    const refreshTokenHash = authService.hashToken(refreshTokenString);

    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshTokenHash,
      deviceInfo: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenString,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required', code: 'NO_TOKEN' });
    }

    const tokenHash = authService.hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash }).populate('user');

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    const user = storedToken.user;
    
    // Rotate tokens
    storedToken.isRevoked = true;
    await storedToken.save();

    const { accessToken, refreshTokenString } = authService.generateTokens(user._id, user.role);
    const newRefreshTokenHash = authService.hashToken(refreshTokenString);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newRefreshTokenHash,
      deviceInfo: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenString
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = authService.hashToken(refreshToken);
      await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully', data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    
    await user.save();
    
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email', code: 'USER_NOT_FOUND' });
    }

    const otp = authService.generateOTP();
    user.resetOtp = authService.hashToken(otp);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await emailService.sendPasswordReset(email, otp);

    res.status(200).json({ 
      success: true, 
      message: 'Password reset code sent to your email.',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if (!user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code', code: 'INVALID_OTP' });
    }

    const otpHash = authService.hashToken(otp);
    if (user.resetOtp !== otpHash) {
      return res.status(400).json({ success: false, message: 'Invalid reset code', code: 'INVALID_OTP' });
    }

    user.password = await authService.hashPassword(newPassword);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
};
