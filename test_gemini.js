const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'C:\\Users\\HP\\Desktop\\Pharma Talent Hub 2.0\\Admin Pannel\\.env' });
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

async function testGemini() {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    try {
        console.log("Testing gemini-2.0-flash...");
        const start = Date.now();
        const res = await model.generateContent("Say 'hello world'");
        console.log("Result:", res.response.text(), "in", Date.now() - start, "ms");
    } catch(e) {
        console.error("Failed:", e.message);
    }
}
testGemini();
