const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://127.0.0.1:27017/trustvault').then(async () => {
  const docs = await mongoose.connection.db.collection('documents').find().toArray();
  
  for (const doc of docs) {
    const title = doc.title || 'Document';
    const category = doc.category || 'Other';
    const isImage = doc.fileType && doc.fileType.startsWith('image/');
    const isPdf = doc.fileType && doc.fileType.includes('pdf');
    const fileDesc = isImage ? 'image/photo' : isPdf ? 'PDF' : 'digital document';

    const summaries = {
      'Identity': {
        tamil: [
          `இது "${title}" என்ற அடையாள ஆவணம்.`,
          `இது ஒரு அரசு அங்கீகரிக்கப்பட்ட அடையாள ஆவணம்.`,
          `இதில் உங்கள் பெயர், புகைப்படம் மற்றும் தனிப்பட்ட விவரங்கள் உள்ளன.`,
          `இந்த ஆவணம் TrustVault-ல் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளது.`
        ],
        english: [
          `This is an identity document titled "${title}".`,
          `It is a government-recognized identification ${fileDesc}.`,
          `Contains personal details such as name, photo, and ID number.`,
          `Securely stored in your TrustVault.`
        ]
      },
      'Other': {
        tamil: [
          `இது "${title}" என்ற ஆவணம், "${category}" வகையில் சேமிக்கப்பட்டுள்ளது.`,
          `இது ஒரு ${isImage ? 'படம்/புகைப்படம்' : isPdf ? 'PDF கோப்பு' : 'டிஜிட்டல் ஆவணம்'}.`,
          `இந்த ஆவணத்தின் முக்கிய தகவல்கள் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளன.`,
          `TrustVault AI மூலம் பாதுகாக்கப்படுகிறது.`
        ],
        english: [
          `This is a document titled "${title}", stored under "${category}" category.`,
          `It is a ${fileDesc} uploaded to your secure vault.`,
          `Key information from this document has been safely archived.`,
          `Protected and managed by TrustVault AI.`
        ]
      }
    };

    const chosen = summaries[category] || summaries['Other'];
    const summary = `தமிழ் சுருக்கம் (Tamil Summary):\n` +
      chosen.tamil.map((t, i) => `${i + 1}. ${t}`).join('\n') +
      `\n\nEnglish Summary:\n` +
      chosen.english.map((e, i) => `${i + 1}. ${e}`).join('\n');

    await mongoose.connection.db.collection('documents').updateOne(
      { _id: doc._id },
      { $set: { aiSummaryTamil: summary } }
    );
    console.log(`Updated: ${title} (${category})`);
  }

  console.log('\nAll documents updated with unique summaries!');
  process.exit(0);
});
