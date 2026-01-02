import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateWordDetails = async (term: string): Promise<AISuggestion | null> => {
  if (!apiKey) {
    console.warn("No API Key available for Gemini");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide the Traditional Chinese meaning (specifically suitable for TOEIC context) and a TOEIC-level English example sentence for the word: "${term}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING, description: "Traditional Chinese definition" },
            example: { type: Type.STRING, description: "A professional example sentence using the word" }
          },
          required: ["meaning", "example"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AISuggestion;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};