const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testVariations() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Variations to try based on models_list.txt
    const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.0-flash-lite'];

    for (const modelName of models) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            const response = await result.response;
            console.log(`Success with ${modelName}:`, response.text().trim());
            return modelName; // Stop at first success
        } catch (error) {
            console.error(`Failed with ${modelName}:`, error.message);
        }
    }
}

testVariations();
