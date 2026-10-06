const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const runTest = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // listModels is not directly exposed on genAI. We can query the models endpoint using fetch or a gRPC request.
    // Actually, in @google/generative-ai, listModels is not a standard helper. Let's try standard model names:
    // Let's try: gemini-2.0-flash, gemini-2.5-flash, gemini-1.5-flash
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-1.5-pro"
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const text = (await result.response).text();
        console.log(`SUCCESS with ${modelName}:`, text);
        process.exit(0);
      } catch (err) {
        console.log(`Failed with ${modelName}:`, err.message);
      }
    }
    process.exit(1);
  } catch (err) {
    console.error('CRASH:', err.message);
    process.exit(1);
  }
};

runTest();
