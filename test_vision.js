const fs = require('fs');
require('dotenv').config({ path: 'C:\\Users\\HP\\Desktop\\Pharma Talent Hub 2.0\\Admin Pannel\\.env' });
const groqKey = process.env.REACT_APP_GROQ_API_KEY;

async function testVision() {
    // create a dummy 1x1 image
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.2-90b-vision-preview",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: "Return JSON {\"test\": \"success\"}." },
                    { type: "image_url", image_url: { url: base64Image } }
                ]
            }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })
    });
    
    if (!res.ok) {
        console.error("Failed:", await res.text());
    } else {
        const data = await res.json();
        console.log("Success:", data.choices[0].message.content);
    }
}
testVision();
