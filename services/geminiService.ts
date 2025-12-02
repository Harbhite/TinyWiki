import { GoogleGenAI, Type, Schema } from "@google/genai";
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

export const generateWikiFromFiles = async (files: FileData[]): Promise<WikiData> => {
  // Accessing the API key exposed via vite.config.ts define
  const apiKey = "AIzaSyC4liBDPe9Db6-cN09q5GKymwf8d8-MMxM";
  if (!apiKey) {
    throw new Error("API Key is missing. Please set GEMINI_API_KEY in .env.local");
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
        temperature: 0.2, // Lower temperature for more focused and coherent output
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as WikiData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
