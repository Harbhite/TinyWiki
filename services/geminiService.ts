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
    title: { type: Type.STRING, description: "A clear, professional title for the Wiki." },
    summary: { type: Type.STRING, description: "A comprehensive summary (approx 150-200 words) that explains the core concepts using plain, direct language. No analogies." },
    readingTimeMinutes: { type: Type.NUMBER, description: "Calculated reading time." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Direct and descriptive section heading." },
          content: { type: Type.STRING, description: "Exhaustive, long-form explanation in Markdown. Use simplified language and short, punchy sentences. Go straight to the point. DO NOT use analogies or metaphors. Each section should be very detailed (5-7 paragraphs) but purely factual and clear. Bold key terms (**term**)." },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 direct, simplified takeaways that summarize the facts."
          },
          citations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Source markers (e.g., 'Page 4')."
          }
        },
        required: ["heading", "content", "keyPoints", "citations"]
      }
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Directly related topics for further study."
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
    You are an expert technical writer known for extreme clarity and exhaustive detail. 
    Analyze the materials and create a massive Wiki entry that is both simple and deep.
    
    CRITICAL INSTRUCTIONS:
    1. EXHAUSTIVE COVERAGE: Leave no detail behind. If a concept is in the source, explain it thoroughly.
    2. ABSOLUTELY NO ANALOGIES: Do not use "it's like a..." or any metaphors. Explain the concepts directly for what they are.
    3. SIMPLIFIED PROSE: Use plain, easy-to-understand words. Avoid jargon where a simple word suffices.
    4. CONCISE SENTENCES: Keep sentences short and direct. No fluff or flowery introductions.
    5. FORMATTING: Use clean Markdown. Bold (**term**) core concepts.
    
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
    Generate an exhaustive, highly detailed Wiki for the topic: "${topic}".
    
    CRITICAL INSTRUCTIONS:
    1. FACTUAL DEPTH: Provide a massive amount of detail. 5-7 long paragraphs per section.
    2. NO ANALOGIES: Strictly avoid metaphors or analogies. Stick to direct, literal explanations.
    3. SIMPLE LANGUAGE: Explain complex parts using the simplest factual language possible.
    4. NEAT FORMATTING: Use headings and bolding for readability.
    
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
        temperature: 0.2, 
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return parseGeminiResponse(response.text);
  } catch (error) {
    console.error("Topic Generation Error:", error);
    throw error;
  }
};