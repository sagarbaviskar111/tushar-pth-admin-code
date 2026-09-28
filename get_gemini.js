const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'C:\\Users\\HP\\Desktop\\Pharma Talent Hub 2.0\\Admin Pannel\\.env' });
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

async function getModels() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log(data.models.map(m => m.name));
}
getModels();
