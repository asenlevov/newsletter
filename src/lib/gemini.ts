import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Initialize Vertex with your Cloud project and location as per the README
const ai = new GoogleGenAI({
  vertexai: true,
  project: "iris-391113",
  location: "global",
});

export const geminiAi = ai;
export const geminiModelName = "gemini-2.5-pro";
export const generationConfig = {
    maxOutputTokens: 65535,
    temperature: 1,
    topP: 0.95,
    seed: 0,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      }
    ],
    tools: [],
  }; 