import { GoogleGenAI, Type } from "@google/genai";
import { FileData, WikiData } from "../types";

const processFile = (file: FileData) => {
  // Extract base64 part if it contains the data URL prefix
  const base64Data = file.data.includes('base64,') 
    ? file.data.split('base64,')[1] 
    : file.data;

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

const wikiSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy, clear title for the material." },
    summary: { type: Type.STRING, description: "A 2-3 sentence executive summary of the entire document." },
    readingTimeMinutes: { type: Type.NUMBER, description: "Estimated reading time in minutes." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Section title." },
          content: { type: Type.STRING, description: "Detailed, coherent explanation in Markdown. Explain concepts in depth." },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 concise bullet points for this section."
          },
          citations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Source references (e.g., 'Slide 5')."
          }
        },
        required: ["heading", "content", "keyPoints", "citations"]
      }
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5 related concepts."
    }
  },
  required: ["title", "summary", "sections", "readingTimeMinutes", "relatedTopics"]
};

const parseGeminiResponse = (text: string | undefined): WikiData => {
  if (!text) throw new Error("No response received from the AI.");
  
  let cleanText = text.trim();
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleanText) as WikiData;
  } catch (error) {
    console.error("JSON Parse Error:", error, "Raw text:", text);
    throw new Error("The AI provided an invalid data format. Please try again.");
  }
};

export const generateWikiFromFiles = async (files: FileData[]): Promise<WikiData> => {
  // Always use new GoogleGenAI({apiKey: process.env.API_KEY}) as per rules.
  // Using gemini-3-flash-preview for free quota compatibility and fast synthesis.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileParts = files.map(processFile);
  
  const prompt = `
    You are an expert educational content creator. Transform these raw documents into a structured Wiki entry.
    Objective: Create a coherent learning resource where concepts flow logically.
    Guidelines: Deep explanations, Markdown formatting (**bold** definitions), and specific citations (e.g. 'Slide 4').
    Return ONLY raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        role: 'user',
        parts: [{ text: prompt }, ...fileParts]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: wikiSchema,
        temperature: 0.2, 
      }
    });

    return parseGeminiResponse(response.text);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateWikiFromTopic = async (topic: string): Promise<WikiData> => {
  // Always use new GoogleGenAI({apiKey: process.env.API_KEY}) as per rules.
  // Using gemini-3-flash-preview for free quota compatibility.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate a comprehensive, structured Wiki entry for the topic: "${topic}".
    Explain the concept deeply but simply. Use Markdown (**bold** for terms).
    Return ONLY raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        role: 'user',
        parts: [{ text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: wikiSchema,
        temperature: 0.3, 
      }
    });

    return parseGeminiResponse(response.text);
  } catch (error) {
    console.error("Topic Generation Error:", error);
    throw error;
  }
};