require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

// Database Connection
connectDB();

// Routes
app.use('/api', routes);
// Uploads Static Serving & Fallback
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}), (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#0f172a"/>
      <rect x="20" y="20" width="560" height="360" rx="16" fill="#1e293b" stroke="#7C3AED" stroke-width="4"/>
      <text x="300" y="140" font-family="Arial" font-size="28" font-weight="bold" fill="#7C3AED" text-anchor="middle">TrustVault Secure Document</text>
      <text x="300" y="200" font-family="Arial" font-size="20" fill="#ffffff" text-anchor="middle">📄 Document Preview &amp; Verification</text>
      <text x="300" y="260" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">Shared securely via TrustVault AI</text>
    </svg>
  `);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    details: []
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
