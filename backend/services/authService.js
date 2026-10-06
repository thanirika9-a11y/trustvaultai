const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'secret123',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d' }
  );

  // Generate a random refresh token string (will be hashed in DB)
  const refreshTokenString = crypto.randomBytes(40).toString('hex');
  
  // Also create a JWT refresh token if we want stateless refresh token verification,
  // but using a random string + DB lookup (stateful) is more secure for revocation.
  // We'll use stateful refresh tokens for better security control.

  return { accessToken, refreshTokenString };
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateOTP = () => {
  // Generate a 6 digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateTokens,
  hashToken,
  generateOTP
};
