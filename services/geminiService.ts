import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: API_KEY is managed via process.env as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArrivalMessage = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a short, funny, and celebratory single sentence notification telling the user they have arrived at their destination. Do not use quotes.",
      config: {
        maxOutputTokens: 50,
        temperature: 0.9,
      },
    });
    return response.text || "You have arrived at your destination!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "You have arrived at your destination!";
  }
};
