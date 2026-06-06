// ============================================================
// GROQ KEY SMOKE TEST
// ============================================================
// Confirms your GROQ_API_KEY works before testing the full app.
// RUN:  cd backend && node src/scripts/testGroq.js

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { generateChat, GROQ_MODEL } from "../lib/groq.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const run = async () => {
  if (!process.env.GROQ_API_KEY) {
    console.error("✗ No GROQ_API_KEY found in backend/.env");
    process.exit(1);
  }

  console.log(`Testing Groq with model: ${GROQ_MODEL}…`);
  try {
    const reply = await generateChat(
      [
        { role: "system", content: "You are a test assistant." },
        { role: "user", content: "Reply with a short confirmation that you are working." },
      ],
      { maxTokens: 50 }
    );
    console.log("--- SUCCESS ---");
    console.log("AI Response:", reply);
    console.log("---------------");
    process.exit(0);
  } catch (error) {
    console.error("--- TEST FAILED ---");
    console.error("Status:", error.status || "n/a");
    console.error("Message:", error.message);
    process.exit(1);
  }
};

run();
