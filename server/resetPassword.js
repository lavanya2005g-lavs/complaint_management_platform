require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    const hash = await bcrypt.hash('ComplaintApp@123', 10);
    const r = await User.updateOne(
      { email: 'admin2026@gmail.com', role: 'admin' },
      { $set: { password: hash } }
    );
    
    console.log('matched:', r.matchedCount, 'modified:', r.modifiedCount);
    
    if (r.matchedCount === 0) {
      console.log('\nAdmin not found! Creating new admin...');
      const newAdmin = await User.create({
        name: 'Admin',
        email: 'admin2026@gmail.com',
        password: hash,
        role: 'admin'
      });
      console.log('✅ Admin created:', newAdmin.email);
    } else {
      console.log('✅ Password updated successfully');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
})();
