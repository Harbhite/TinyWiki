import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
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

const wikiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy, clear title for the material." },
    summary: { type: Type.STRING, description: "A 2-3 sentence executive summary of the entire document, synthesized for clarity." },
    readingTimeMinutes: { type: Type.NUMBER, description: "Estimated reading time in minutes." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Section title. Ensure these form a logical narrative arc." },
          content: { type: Type.STRING, description: "Detailed, coherent explanation in Markdown. Use paragraphs to explain concepts in depth. Define jargon. Ensure smooth transitions from previous sections." },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 concise bullet points summarizing the most critical takeaways from this section."
          },
          citations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific source references (e.g., 'Slide 5', 'Page 12: Paragraph 2') or direct quotes supporting this section."
          }
        },
        required: ["heading", "content", "keyPoints", "citations"]
      }
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5 related concepts or topics to explore further."
    }
  },
  required: ["title", "summary", "sections", "readingTimeMinutes", "relatedTopics"]
};

// Shared helper to parse and clean response
const parseGeminiResponse = (text: string | undefined): WikiData => {
  if (!text) throw new Error("No response from AI");
  
  let cleanText = text.trim();
  
  // Robust extraction of JSON object to handle markdown fences or pre/post text
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleanText) as WikiData;
  } catch (error) {
    console.error("JSON Parse Error:", error);
    console.error("Raw Text:", text);
    throw new Error("Failed to parse the generated content. Please try again.");
  }
};

export const generateWikiFromFiles = async (files: FileData[]): Promise<WikiData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const fileParts = files.map(processFile);
  
  const prompt = `
    You are an expert educational content creator and wiki editor. 
    Your task is to transform the attached raw documents (PDFs, slides, notes) into a beautifully structured, cohesive Wiki entry.
    
    OBJECTIVE:
    Create a learning resource that feels like a coherent article, not just a disjointed summary. 
    The reader should be able to learn the subject from scratch using this wiki alone.
    
    GUIDELINES:
    1. **Narrative Consistency**: Ensure a logical flow from one section to the next. Use transition sentences to bridge concepts.
    2. **Deep Explanation**: Do not just list facts. Explain *why* and *how*. Synthesize information from across the documents.
    3. **Tone**: Educational, clear, slightly playful but authoritative (like a high-quality tech blog or modern textbook).
    4. **Formatting**: Use Markdown. Use **bold** for key terms definitions. Use *italics* for emphasis.
    5. **Citations**: You must attribute facts. If a section discusses a specific concept found on Slide 4, add a citation "Slide 4".
    6. **Structure**: Start with foundational concepts and move to advanced details.
    
    AUDIENCE:
    Someone learning this topic for the first time who wants a deep dive but in simple, jargon-free terms.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [
          { text: prompt },
          ...fileParts
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: wikiSchema,
        temperature: 0.2, 
      }
    });

    return parseGeminiResponse(response.text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateWikiFromTopic = async (topic: string): Promise<WikiData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert educational content creator.
    Your task is to generate a comprehensive, structured Wiki entry for the topic: "${topic}".
    
    OBJECTIVE:
    Create a summarized yet explained "wikied bit" regarding this topic. It should serve as a standalone learning resource.
    
    GUIDELINES:
    1. **Narrative Consistency**: Ensure a logical flow.
    2. **Deep Explanation**: Explain the concept deeply but simply.
    3. **Tone**: Educational, clear, slightly playful but authoritative.
    4. **Formatting**: Use Markdown. Use **bold** for key terms.
    5. **Citations**: Since you are generating this from general knowledge, use the citations field to list Key Concepts, Historical Context, or Standard Reference Works associated with the facts.
    6. **Structure**: 3-5 sections maximum. Keep it focused.
    
    AUDIENCE:
    A curious learner exploring this specific sub-topic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    console.error("Gemini API Error (Topic):", error);
    throw error;
  }
};