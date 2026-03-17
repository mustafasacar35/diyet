require('dotenv').config({ path: '.env.local' });

async function testRawFetch() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash"; // Try without prefix first in URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`Testing raw fetch to ${model}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say 'OK'" }] }]
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testRawFetch();
