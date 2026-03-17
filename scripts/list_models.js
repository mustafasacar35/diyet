const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found!');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('Fetching available models...');

    try {
        // For some reason, listModels is not directly exposed in some versions of the SDK wrapper easily,
        // or requires a specific client. Let's try the model manager if available, or just a raw fetch.
        // The SDK usually exposes it via `getGenerativeModel` but listing is often on the main class or separate.
        // Actually, the Node SDK doesn't always have a direct `listModels` helper on the main instance in older versions.
        // Let's try to just use a raw fetch to the API to be sure.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            const fs = require('fs');
            const names = data.models.map(mod => mod.name).join('\n');
            fs.writeFileSync('models_list.txt', names);
            console.log('Model names written to models_list.txt');
        } else {
            console.error('Failed to list models:', data);
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
