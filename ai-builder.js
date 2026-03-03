import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in .env file");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function buildProject() {
  try {
    console.log("🚀 Reading PROJECT_SPEC.md...");

    const spec = fs.readFileSync("PROJECT_SPEC.md", "utf8");

    console.log("🤖 Generating project from Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
You are a senior full-stack engineer.

Return ONLY valid JSON.
Do not wrap in markdown.
Structure:

{
  "files": [
    {
      "path": "folder/file.ext",
      "content": "file content"
    }
  ]
}

Project specification:
${spec}
`,
    });

    let text = response.text;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);

    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error("Invalid JSON format from AI");
    }

    console.log("📁 Creating project files...");

    parsed.files.forEach((file) => {
      const filePath = path.join(process.cwd(), file.path);
      const dir = path.dirname(filePath);

      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
    });

    console.log("✅ Project generated successfully!");
  } catch (error) {
    console.error("❌ ERROR:");
    console.error(error);
  }
}

buildProject();