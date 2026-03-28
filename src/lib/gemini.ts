import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGenerativeModel = (modelName: string = 'gemini-pro') => {
    if (!gemini) {
        throw new Error('GEMINI_API_KEY is not set');
    }
    return gemini.getGenerativeModel({ model: modelName });
};
