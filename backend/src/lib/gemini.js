import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env.js";

// Validation for API Key
if (!ENV.GEMINI_API_KEY) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in .env file.");
}

/**
 * GEMINI SDK CONFIGURATION (MODERN IMPLEMENTATION)
 * Using gemini-2.5-flash as requested.
 */
const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: {
        role: "system",
        parts: [{
            text: `You are Convo AI, an intelligent and helpful AI assistant built into ConvoApp.
            - Provide concise, helpful, and professional responses.
            - Maintain awareness of the conversation history.
            - Use Markdown for formatting (bold, lists, code snippets).
            - Always identify yourself as Convo AI when asked.`
        }]
    }
});

/**
 * Helper to handle Gemini Errors gracefully
 */
export const handleGeminiError = (error) => {
    console.error("--- GEMINI API ERROR ---");
    if (error.status === 404) {
        console.error("Error 404: The specified model was not found. Please check if 'gemini-2.5-flash' is available for your API key.");
    } else if (error.status === 429) {
        console.error("Error 429: Quota exceeded. You are sending requests too fast or have hit your limit.");
    } else if (error.status === 403) {
        console.error("Error 403: Permission denied. Check your API key and project permissions.");
    } else {
        console.error(`Status: ${error.status}`);
        console.error(`Message: ${error.message}`);
    }
    console.error(error);
    console.error("-------------------------");
};
