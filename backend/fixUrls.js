const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trustvault');
  const Document = require('./models/Document');
  
  const allDocs = await Document.find({});
  let count = 0;
  for (const doc of allDocs) {
    if (!doc.fileUrl || doc.fileUrl.includes('simulated-cloudinary-url') || doc.fileUrl.includes('s3.amazonaws.com') || doc.fileUrl.includes('dummy.pdf') || doc.fileUrl.includes('sample_property.pdf')) {
      doc.fileUrl = `http://localhost:5000/api/documents/view/${doc._id}`;
      await doc.save();
      console.log(`Updated ${doc.title} -> ${doc.fileUrl}`);
      count++;
    }
  }
  console.log(`Successfully updated ${count} documents.`);
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
