import { GoogleGenAI, Type } from "@google/genai";
import { FileData, WikiData } from "../types";

const processFile = (file: FileData) => {
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
    title: { type: Type.STRING, description: "A high-level, professional title for the Wiki." },
    summary: { type: Type.STRING, description: "A comprehensive executive summary (approx 150 words) that sets the stage." },
    readingTimeMinutes: { type: Type.NUMBER, description: "Calculated reading time." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Descriptive section heading." },
          content: { type: Type.STRING, description: "Long-form, detailed explanation in Markdown. Each section should be substantial (2-4 paragraphs minimum) with deep theoretical or practical insights. Use **bold** for key terms." },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4-6 detailed takeaways for this section."
          },
          citations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific source markers (e.g., 'Document: Page 4' or 'Slide 12')."
          }
        },
        required: ["heading", "content", "keyPoints", "citations"]
      }
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Advanced related concepts for further study."
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileParts = files.map(processFile);
  
  const prompt = `
    You are an elite research analyst and educational architect. 
    Analyze the provided materials and synthesize them into a HIGH-DETAIL, LONG-FORM Wiki entry.
    
    CRITICAL INSTRUCTIONS:
    1. EXHAUSTIVE DEPTH: Do not skip nuances. Each section should be a deep dive.
    2. EDUCATIONAL PROSE: Write in a sophisticated yet clear academic style.
    3. FORMATTING: Use Markdown effectively. Define key terms in **bold** within the flow of text.
    4. ACCURACY: Ensure citations are tied specifically to parts of the provided documents.
    5. STRUCTURE: Create a logical narrative arc across sections.
    
    Return ONLY raw JSON according to the schema.
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
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return parseGeminiResponse(response.text);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateWikiFromTopic = async (topic: string): Promise<WikiData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate an exhaustive, high-detail professional Wiki entry for the topic: "${topic}".
    
    CRITICAL INSTRUCTIONS:
    1. COMPREHENSIVE COVERAGE: Include historical context, core mechanics, modern applications, and future outlook.
    2. VERBOSE QUALITY: Prioritize length and depth over brevity. Each section must be rich with information.
    3. STYLE: Use beautiful Markdown. Identify and **bold** all major technical terms or key concepts.
    
    Return ONLY raw JSON according to the schema.
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
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return parseGeminiResponse(response.text);
  } catch (error) {
    console.error("Topic Generation Error:", error);
    throw error;
  }
};