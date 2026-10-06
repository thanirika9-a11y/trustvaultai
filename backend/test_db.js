const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Category = require('./models/Category');
const Document = require('./models/Document');
const Loan = require('./models/Loan');
const SharedDocument = require('./models/SharedDocument');
const Reminder = require('./models/Reminder');
const ActivityLog = require('./models/ActivityLog');

const formatBytesToGB = (bytes) => {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
};

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB Connected');
    
    // Find any user
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database.');
      process.exit(0);
    }
    
    const userId = user._id;
    console.log('Testing dashboard for user:', user.email, userId);

    // 1. Get statistics counts
    const totalDocs = await Document.countDocuments({ owner: userId });
    const totalCategories = await Category.countDocuments({ owner: userId });
    const totalFamilyMembers = 0;
    const totalSharedWithMe = await SharedDocument.countDocuments({ sharedWithUser: userId });

    // 2. Storage aggregation
    const storageResult = await Document.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    const storageUsedBytes = storageResult[0]?.totalSize || 0;
    const storageLimitBytes = 10 * 1024 * 1024 * 1024; // 10 GB limit
    const storageUsedGB = formatBytesToGB(storageUsedBytes);
    const storageUsedPercent = Math.min(Math.round((storageUsedBytes / storageLimitBytes) * 100), 100);

    // 3. Upcoming reminders
    const reminders = await Reminder.find({ owner: userId, isCompleted: false })
      .sort({ dueDate: 1 })
      .limit(6);

    const formattedReminders = reminders.map(rem => {
      const remainingTime = rem.dueDate.getTime() - Date.now();
      const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      return {
        _id: rem._id,
        title: rem.title,
        dueDate: rem.dueDate,
        type: rem.type,
        remainingDays: remainingDays > 0 ? remainingDays : 0
      };
    });

    // 4. Documents by category breakdown
    const categoryBreakdown = await Document.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoriesList = await Category.find({ owner: userId });
    const chartData = categoriesList.map(cat => {
      const match = categoryBreakdown.find(b => b._id && b._id.toLowerCase() === cat.name.toLowerCase());
      return {
        name: cat.name,
        count: match ? match.count : 0,
        color: cat.color,
        icon: cat.icon
      };
    });

    // 5. Loan Overview
    const activeLoans = await Loan.countDocuments({ owner: userId, status: 'active' });
    const loansResult = await Loan.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId), status: 'active' } },
      { $group: { _id: null, totalOutstanding: { $sum: '$outstandingBalance' }, totalEmi: { $sum: '$monthlyEmi' } } }
    ]);
    const totalOutstanding = loansResult[0]?.totalOutstanding || 0;
    const monthlyEmi = loansResult[0]?.totalEmi || 0;
    const nextDueLoan = await Loan.findOne({ owner: userId, status: 'active' })
      .sort({ nextDueDate: 1 })
      .select('nextDueDate');

    console.log('SUCCESS: All database queries completed successfully without crash.');
    process.exit(0);
  } catch (err) {
    console.error('CRASH ERROR FOUND:', err);
    process.exit(1);
  }
};

runTest();
