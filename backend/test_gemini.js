const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const runTest = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing Gemini API key starting with:', apiKey ? apiKey.substring(0, 5) : 'NONE');
  
  if (!apiKey) {
    console.log('No API key found in .env');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('Sending test prompt to Gemini...');
    const result = await model.generateContent("Say hello in Tamil.");
    const response = await result.response;
    console.log('GEMINI RESPONSE SUCCESS:', response.text());
    process.exit(0);
  } catch (err) {
    console.error('GEMINI API CALL FAILED:', err.message);
    process.exit(1);
  }
};

runTest();
