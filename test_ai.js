const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config({ path: 'C:\\Users\\HP\\Desktop\\Pharma Talent Hub 2.0\\Admin Pannel\\.env' });

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
const groqKey = process.env.REACT_APP_GROQ_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const promptContent = ["Tell me a joke."];
const contentStr = "Tell me a joke.";

const fetchFromGroq = async (modelName) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: contentStr }],
            temperature: 0.1
        })
    });
    if (!res.ok) throw new Error(`Groq API error on ${modelName}: ` + await res.text());
    const data = await res.json();
    return data.choices[0].message.content;
};

const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
const groqModels = ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b'];

const promises = [];

geminiModels.forEach(modelName => {
    const model = genAI.getGenerativeModel({ model: modelName });
    promises.push(
        model.generateContent(promptContent)
        .then(res => `Gemini ${modelName} success`)
        .catch(err => { throw new Error(`Gemini ${modelName} failed: ${err.message}`) })
    );
});

groqModels.forEach(modelName => {
    promises.push(
        fetchFromGroq(modelName)
        .then(res => `Groq ${modelName} success`)
        .catch(err => { throw new Error(`Groq ${modelName} failed: ${err.message}`) })
    );
});

Promise.any(promises)
    .then(res => console.log("Fastest:", res))
    .catch(err => {
        console.error("All promises rejected!");
        console.error(err.errors);
    });
