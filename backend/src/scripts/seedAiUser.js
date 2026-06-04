import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;
const AI_USER_ID = "6751e1b5f1a2c3d4e5f6a7b8";

const seedAiUser = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const existingAi = await User.findById(AI_USER_ID);
    if (existingAi) {
      console.log("AI User already exists.");
      process.exit(0);
    }

    console.log("Creating AI User...");
    await User.create({
      _id: AI_USER_ID,
      fullName: "Convo AI",
      email: "ai@convoapp.local",
      password: "ai-sentinel-user-password-not-used",
      profilePic: "https://res.cloudinary.com/dgm6oyt9u/image/upload/v1717545600/ai-avatar.png", // Generic AI avatar or leave empty
    });

    console.log("AI User created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed AI User:", error);
    process.exit(1);
  }
};

seedAiUser();
