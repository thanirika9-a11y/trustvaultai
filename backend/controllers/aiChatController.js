const { GoogleGenerativeAI } = require('@google/generative-ai');
const Document = require('../models/Document');

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
let model;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  } catch (initErr) {
    console.warn('Failed to initialize Gemini API:', initErr.message);
    model = null;
  }
}

// Intelligent fallback responder when Gemini API is unavailable
const getIntelligentFallback = (userQuestion, vaultDocs) => {
  const q = userQuestion.toLowerCase().trim();
  const docCount = vaultDocs.length;

  // Build doc lists for context
  const docNames = vaultDocs.map((d, i) => `${i + 1}. 📄 **${d.title}** (${d.category})`).join('\n');
  const categories = [...new Set(vaultDocs.map(d => d.category))];
  const categoryCount = {};
  vaultDocs.forEach(d => { categoryCount[d.category] = (categoryCount[d.category] || 0) + 1; });
  const categoryList = Object.entries(categoryCount).map(([k, v]) => `• ${k}: ${v} documents`).join('\n');

  // Expiring documents
  const now = new Date();
  const expiringDocs = vaultDocs.filter(d => d.expiryDate && new Date(d.expiryDate) > now)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const expiringSoon = expiringDocs.filter(d => {
    const diff = (new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24);
    return diff <= 90;
  });

  // --- Pattern matching for diverse questions ---

  // Greetings
  if (/^(hi|hello|hey|vanakkam|வணக்கம்|namaste|good morning|good evening|good afternoon)[\s!.]*$/i.test(q)) {
    return `வணக்கம்! 🙏 நான் உங்கள் TrustVault AI உதவியாளர்.\n\nYour vault currently has **${docCount} documents** across ${categories.length} categories.\n\nHow can I help you today? You can ask me:\n• 📄 "What documents do I have?"\n• 📊 "Show my categories"\n• ⏰ "Any expiring documents?"\n• 🔒 "How is my data secured?"`;
  }

  // Document listing queries
  if (/\b(doc|vault|list|enna|what|show|irukku|documents?|files?|all|my|en|ennoda)\b/.test(q) && 
      /\b(doc|vault|list|irukku|have|uploaded|files?|show|enna|all)\b/.test(q)) {
    if (docCount === 0) {
      return `உங்கள் TrustVault-ல் இப்போது எந்த ஆவணமும் இல்லை.\n\n(Your vault is currently empty.) You can upload documents using the **Upload Document** button on the Dashboard.`;
    }
    return `📂 **உங்கள் TrustVault ஆவணங்கள்** (${docCount} Documents):\n\n${docNames}\n\n**Categories:**\n${categoryList}\n\nஎந்த ஆவணம் பற்றியும் மேலும் கேட்கலாம்! (Ask me about any specific document for more details.)`;
  }

  // Specific document search
  const searchTerms = ['aadhar', 'aadhaar', 'pan', 'passport', 'license', 'driving', 'insurance', 'loan', 'policy', 
    'certificate', 'marksheet', 'degree', 'birth', 'voter', 'ration', 'property', 'deed', 'will', 'medical', 'bill'];
  const matchedTerm = searchTerms.find(t => q.includes(t));
  if (matchedTerm) {
    const matchedDocs = vaultDocs.filter(d => 
      d.title.toLowerCase().includes(matchedTerm) || 
      d.category.toLowerCase().includes(matchedTerm) ||
      (d.aiSummaryTamil && d.aiSummaryTamil.toLowerCase().includes(matchedTerm))
    );
    if (matchedDocs.length > 0) {
      const matchList = matchedDocs.map((d, i) => 
        `${i + 1}. 📄 **${d.title}** (${d.category}) - Uploaded: ${new Date(d.createdAt).toLocaleDateString()}` +
        (d.expiryDate ? `\n   ⏰ Expiry: ${new Date(d.expiryDate).toLocaleDateString()}` : '') +
        (d.aiSummaryTamil ? `\n   📝 ${d.aiSummaryTamil.substring(0, 100)}...` : '')
      ).join('\n\n');
      return `🔍 **"${matchedTerm}" related documents found:**\n\n${matchList}\n\nMy Vault பக்கத்தில் இந்த ஆவணங்களைப் பார்க்கலாம். (You can view these in My Vault.)`;
    } else {
      return `🔍 "${matchedTerm}" தொடர்பான ஆவணம் உங்கள் vault-ல் இல்லை.\n\n(No "${matchedTerm}" related documents found in your vault.) You can upload one using **Upload Document** on the Dashboard.\n\nYou currently have ${docCount} documents in other categories.`;
    }
  }

  // Category queries
  if (/\b(category|categories|categori|vagai|types?|classify)\b/.test(q)) {
    if (docCount === 0) {
      return `உங்கள் vault-ல் இப்போது ஆவணங்கள் இல்லை.\n\nAvailable categories: Identity, Banking and Finance, Loans, Insurance, Property, Medical, Education, Employment, Vehicle, Legal, Bills and Payments, Digital Legacy, Other.`;
    }
    return `📊 **Documents by Category:**\n\n${categoryList}\n\n**Total:** ${docCount} documents across ${categories.length} categories.\n\nஎந்த category பற்றியும் கேட்கலாம்!`;
  }

  // Expiry/due date queries
  if (/\b(expir|due|renew|remind|pending|deadline|overdue|last date|காலாவதி|முடிவு)\b/.test(q)) {
    if (expiringDocs.length === 0) {
      return `✅ உங்கள் vault-ல் எந்த ஆவணத்திற்கும் expiry date set செய்யப்படவில்லை.\n\n(No documents with expiry dates found.) Tip: Upload documents like insurance policies, passports, or licenses - our AI will automatically detect and track expiry dates!`;
    }
    const expiryList = expiringDocs.slice(0, 5).map((d, i) => {
      const days = Math.ceil((new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24));
      const urgency = days <= 30 ? '🔴' : days <= 90 ? '🟡' : '🟢';
      return `${urgency} **${d.title}** - Expires: ${new Date(d.expiryDate).toLocaleDateString()} (${days} days left)`;
    }).join('\n');
    return `⏰ **Upcoming Expirations:**\n\n${expiryList}\n\n${expiringSoon.length > 0 ? `⚠️ ${expiringSoon.length} document(s) expiring within 90 days!` : '✅ No urgent expirations in the next 90 days.'}`;
  }

  // Security/encryption queries
  if (/\b(secur|encrypt|safe|protect|privacy|hack|steal|data|backup|lock|password|bio)\b/.test(q)) {
    return `🔒 **TrustVault Security Features:**\n\n• **256-bit AES Encryption** - All documents are encrypted at rest\n• **End-to-End Protection** - Data is encrypted during transfer\n• **Biometric Login** - Fingerprint & Face ID supported\n• **JWT Authentication** - Secure token-based access\n• **Role-Based Sharing** - Only authorized family members can view shared docs\n• **Cloud Backup** - Documents stored securely on Cloudinary with encryption\n\nஉங்கள் ஆவணங்கள் முழுமையாக பாதுகாக்கப்பட்டுள்ளன! (Your documents are fully protected.)`;
  }

  // How to / help queries
  if (/\b(how to|how do|help|guide|tutorial|upload|share|add|delete|remove|scan|edit)\b/.test(q)) {
    return `📖 **TrustVault Guide:**\n\n**📤 Upload Document:**\nDashboard → Upload Document → Select file → AI auto-analyzes it\n\n**📸 Quick Scan:**\nDashboard → Quick Scan → Take photo → Auto-upload\n\n**👥 Share Document:**\nMy Vault → Select document → Share → Enter family member's email\n\n**👨‍👩‍👧 Add Family Member:**\nDashboard → Add Family Member → Enter name & email\n\n**🗑️ Delete Document:**\nMy Vault → Expand document → Delete button\n\n**🔍 Search:**\nMy Vault → Search bar → Type document name\n\nவேறு எந்த உதவியும் வேண்டுமா? (Need more help?)`;
  }

  // Loan/EMI queries
  if (/\b(loan|emi|borrow|interest|repay|outstanding|principal|tenure)\b/.test(q)) {
    const loanDocs = vaultDocs.filter(d => d.category === 'Loans');
    if (loanDocs.length > 0) {
      const loanList = loanDocs.map((d, i) => 
        `${i + 1}. 📄 **${d.title}**` +
        (d.amountDue ? ` - Amount: ${d.amountDue}` : '') +
        (d.dueDate ? ` - Due: ${new Date(d.dueDate).toLocaleDateString()}` : '')
      ).join('\n');
      return `💰 **Loan Documents in Your Vault:**\n\n${loanList}\n\nMy Vault-ல் இருந்து loan documents-ஐ பார்க்கலாம்.\n\nTip: Upload loan statements and our AI will automatically extract EMI dates and amounts!`;
    }
    return `💰 உங்கள் vault-ல் loan documents இல்லை.\n\n(No loan documents found.) Upload your loan agreements and statements - TrustVault AI will extract:\n• EMI due dates\n• Outstanding amounts\n• Interest rates\n• Payment schedules`;
  }

  // Count queries
  if (/\b(how many|count|total|ethana|எத்தனை)\b/.test(q)) {
    return `📊 **Your Vault Summary:**\n\n• **Total Documents:** ${docCount}\n• **Categories Used:** ${categories.length}\n\n${docCount > 0 ? `**Breakdown:**\n${categoryList}` : 'Upload documents to get started!'}\n\nவேறு எந்தக் கேள்வியும் கேட்கலாம்!`;
  }

  // Tamil-specific queries
  if (/[\u0B80-\u0BFF]/.test(q)) {
    return `வணக்கம்! நான் உங்கள் TrustVault AI உதவியாளர்.\n\nஉங்கள் vault-ல் **${docCount} ஆவணங்கள்** உள்ளன.\n\n${docCount > 0 ? `**வகைகள்:**\n${categoryList}` : 'தயவுசெய்து Dashboard-ல் உள்ள "Upload Document" button-ஐ பயன்படுத்தி ஆவணங்களை பதிவேற்றுங்கள்.'}\n\nஉங்கள் ஆவணங்கள், EMI தேதிகள், காலாவதி தேதிகள் பற்றி எந்தக் கேள்வியும் கேட்கலாம்!`;
  }

  // Thank you
  if (/\b(thank|thanks|nandri|நன்றி|great|good|nice|awesome|super)\b/.test(q)) {
    return `நன்றி! 🙏 Thank you for using TrustVault AI!\n\nI'm always here to help with your documents. Feel free to ask me anything anytime!\n\nஉங்கள் vault-ல் ${docCount} ஆவணங்கள் பாதுகாப்பாக உள்ளன. 🔒`;
  }

  // Default - give a helpful response instead of a generic one
  return `🤖 **TrustVault AI Assistant**\n\nI can help you with:\n\n📄 **Documents:** "What documents do I have?" / "Show my vault"\n🔍 **Search:** "Do I have Aadhaar?" / "Find my insurance"\n📊 **Categories:** "Show categories" / "How many documents?"\n⏰ **Expiry Tracking:** "Any expiring documents?" / "Upcoming deadlines"\n💰 **Loans & Finance:** "My loan details" / "EMI information"\n🔒 **Security:** "How is my data secured?"\n📖 **Help:** "How to upload?" / "How to share?"\n\nYou have **${docCount} documents** in your vault. Ask me anything specific!\n\nதமிழிலும் கேட்கலாம்! (You can also ask in Tamil!)`;
};

// @desc    Chat with AI Assistant (Empowered with User's Vault Documents RAG)
// @route   POST /api/ai/chat
// @access  Private
const chatWithAI = async (req, res, next) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Retrieve user's vault documents for RAG context
    let vaultDocs = [];
    try {
      if (req.user && req.user.id) {
        vaultDocs = await Document.find({ 
          $or: [
            { owner: req.user.id },
            { sharedWith: req.user.id }
          ]
        }).select('title category createdAt expiryDate aiSummaryTamil dueDate amountDue reminderType').sort({ createdAt: -1 }).limit(50);
      }
    } catch (_) {}

    // Build context string from user's vault
    let vaultContext = '';
    if (vaultDocs.length > 0) {
      vaultContext = `\n\nUSER'S CURRENT VAULT DOCUMENTS (${vaultDocs.length} documents total):\n` +
        vaultDocs.map((d, i) => 
          `${i + 1}. Title: "${d.title}" | Category: ${d.category} | Created: ${new Date(d.createdAt).toLocaleDateString()}` +
          (d.expiryDate ? ` | Expiry: ${new Date(d.expiryDate).toLocaleDateString()}` : '') +
          (d.dueDate ? ` | Due Date: ${new Date(d.dueDate).toLocaleDateString()}` : '') +
          (d.amountDue ? ` | Amount Due: ${d.amountDue}` : '') +
          (d.aiSummaryTamil ? ` | Notes/Summary: ${d.aiSummaryTamil.replace(/\r?\n/g, ' ').substring(0, 200)}` : '')
        ).join('\n');
    } else {
      vaultContext = '\n\nThe user currently has no documents in their vault or is browsing as a guest.';
    }

    // If Gemini model is not available, use intelligent fallback
    if (!model) {
      const fallbackText = getIntelligentFallback(message, vaultDocs);
      return res.status(200).json({ success: true, response: fallbackText });
    }

    const systemInstruction = `You are the intelligent TrustVault AI Assistant for TrustVault (a secure digital document vault for families).
You help users manage, search, analyze, and answer questions about their personal documents, IDs, financial records, and certificates.
You have real-time access to the user's personal vault documents listed below:
${vaultContext}

Guidelines:
1. When the user asks about what documents they have, specific details of a document, or whether a document is in their vault, consult the list above and provide exact, helpful answers.
2. Respond in the same language/tone as the user (Tamil, Tanglish, or English). If asked in Tamil, give a polite, natural Tamil reply.
3. Explain legal, financial, insurance, and medical terms clearly.
4. Do not mention that you are an external AI by Google. You are the TrustVault AI Assistant.
5. Use markdown formatting (**bold**, bullet points) for readability.
6. If asked about expiry dates, loan EMIs, or deadlines, check the vault documents and provide specific dates.
7. Be helpful and proactive - suggest related actions the user might want to take.`;

    // Format chat history for Gemini API
    let history = (chatHistory || []).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    if (history.length > 0 && history[0].role === 'model') {
      history = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        ...history
      ];
    }

    // Start a chat session with the model with dynamic RAG context
    const chat = model.startChat({
      history,
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }]
      }
    });

    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      return res.status(200).json({ success: true, response: text });
    } catch (apiErr) {
      console.warn('Gemini chat API error, using intelligent fallback:', apiErr?.message);
      // Use intelligent fallback instead of generic response
      const fallbackText = getIntelligentFallback(message, vaultDocs);
      return res.status(200).json({ success: true, response: fallbackText });
    }
  } catch (error) {
    console.error('AI Chat fatal error:', error.message);
    res.status(200).json({ 
      success: true, 
      response: getIntelligentFallback(req.body?.message || '', [])
    });
  }
};

module.exports = {
  chatWithAI
};
