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
    title: { type: Type.STRING, description: "A clear, engaging title for the Wiki." },
    summary: { type: Type.STRING, description: "A comprehensive executive summary (approx 150-200 words) that explains the core essence using simple, relatable language." },
    readingTimeMinutes: { type: Type.NUMBER, description: "Calculated reading time." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Engaging and clear section heading." },
          content: { type: Type.STRING, description: "Exhaustive, long-form explanation in Markdown. Use simple language, short sentences, and plenty of analogies. Each section should be very detailed (4-6 paragraphs minimum) but avoid dense jargon. Bold key terms (**term**)." },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 simplified takeaways that summarize the section's core lessons."
          },
          citations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Source markers (e.g., 'Page 5 of Document')."
          }
        },
        required: ["heading", "content", "keyPoints", "citations"]
      }
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Broader topics for further simple exploration."
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
    You are a master educator who specializes in making complex subjects "simply exhaustive." 
    Analyze the provided materials and create a massive, high-detail Wiki entry.
    
    CRITICAL INSTRUCTIONS:
    1. EXTREME DEPTH: Each section must be a deep dive. Do not be brief.
    2. SIMPLIFIED LANGUAGE: Use the vocabulary of a clear, friendly storyteller. Avoid "corporatespeak" or unnecessary academic complexity.
    3. ANALOGIES: Use frequent analogies to explain difficult parts.
    4. FORMATTING: Use clean Markdown. Bold (**term**) only the most important 5-10 concepts per section.
    5. CITATIONS: Connect every section to the specific documents provided.
    
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
    1. STORYTELLER TONE: Explain as if you are a friendly expert talking to a curious friend.
    2. VERBOSE DEPTH: Give me at least 4-5 long paragraphs per section. Cover everything.
    3. NO JARGON: If you use a technical term, define it immediately in a simple way.
    4. BEAUTIFUL MARKDOWN: Use headings and bolding to make the long text readable.
    
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