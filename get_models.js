const fs = require('fs');
require('dotenv').config({ path: 'C:\\Users\\HP\\Desktop\\Pharma Talent Hub 2.0\\Admin Pannel\\.env' });
const groqKey = process.env.REACT_APP_GROQ_API_KEY;

async function getModels() {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${groqKey}` }
    });
    const data = await res.json();
    console.log(data.data.map(m => m.id));
}
getModels();
