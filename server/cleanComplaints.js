require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const allowedDepartments = ['CSE', 'IT', 'EEE', 'ECE', 'CIVIL'];
    const allowedComplaintTypes = [
      'Academic',
      'Infrastructure',
      'Hostel',
      'College',
      'Transport'
    ];

    const deleteResult = await Complaint.deleteMany({
      $or: [
        { department: { $nin: allowedDepartments } },
        { complaintType: { $nin: allowedComplaintTypes } }
      ]
    });
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} complaints`);
    
    // Show remaining complaints
    const remaining = await Complaint.find({}, { userName: 1, description: 1, createdAt: 1 }).lean();
    console.log(`\n✅ Remaining complaints: ${remaining.length}`);
    remaining.forEach(c => {
      console.log(`  - ${c.userName}: ${c.description.substring(0, 50)}...`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
})();
