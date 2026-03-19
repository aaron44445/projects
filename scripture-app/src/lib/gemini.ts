import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function askGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
  });
  return result.response.text();
}
