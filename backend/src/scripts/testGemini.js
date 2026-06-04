import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
    if (!API_KEY) {
        console.error("No GEMINI_API_KEY found in .env");
        return;
    }

    console.log("Testing Gemini API with model: gemini-2.5-flash...");
    
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Hello! Are you working? Please respond with a short confirmation.";
        
        console.log(`Sending prompt: "${prompt}"`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("--- SUCCESS ---");
        console.log("AI Response:", text);
        console.log("---------------");
    } catch (error) {
        console.error("--- TEST FAILED ---");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
        console.error("Full error details below:");
        console.error(error);
        console.log("-------------------");
    }
}

testGemini();
