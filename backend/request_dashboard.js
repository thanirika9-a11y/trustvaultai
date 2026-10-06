const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const runRequest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the registered user
    const user = await User.findOne({ email: 'thanumahesh340@gmail.com' });
    if (!user) {
      console.log('User thanumahesh340@gmail.com not found in DB.');
      process.exit(1);
    }
    
    // Let's generate a token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET || 'secret123',
      { expiresIn: '15m' }
    );
    
    console.log('Sending dashboard request with token...');
    
    const req = http.get({
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', data);
        process.exit(0);
      });
    });
    
    req.on('error', e => {
      console.error('HTTP REQUEST ERROR:', e.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('CRASH ERROR:', err.message);
    process.exit(1);
  }
};

runRequest();
