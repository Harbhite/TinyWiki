import express, { Router, Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";

export const apiRouter = Router();

// Add options for body parsing just in case it's mounted independently
apiRouter.use(express.json({ limit: "50mb" }));
apiRouter.use(express.urlencoded({ limit: "50mb", extended: true }));

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
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "The core terminology." },
          definition: { type: Type.STRING, description: "A short, perfectly clear explanation/definition of the term." }
        },
        required: ["term", "definition"]
      },
      description: "A list of important terminologies used in the wiki and their short, well-explained definitions."
    }
  },
  required: ["title", "summary", "sections", "readingTimeMinutes", "relatedTopics", "glossary"]
};

const parseGeminiResponse = (text: string | undefined) => {
  if (!text) throw new Error("No response received from the AI.");
  
  let cleanText = text.trim();
  cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("JSON Parse Error:", error, "Raw text:", text);
    throw new Error("The AI provided an invalid data format. Please try again.");
  }
};

const handleApiError = (error: any, defaultMsg: string) => {
  let errorMsg = error.message || defaultMsg;
  try {
    const parsed = JSON.parse(error.message);
    if (parsed.error && parsed.error.message) {
      errorMsg = parsed.error.message;
    }
  } catch (e) {
    // not JSON
  }
  
  if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
    return "You have exceeded your Gemini API usage quota. Please check your API key billing details or try again later.";
  }
  if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE")) {
    return "The AI is currently experiencing high demand. Please try again in a few moments.";
  }
  if (errorMsg.includes("400") && errorMsg.includes("API key not valid")) {
    return "Your Gemini API key is invalid. Please check your settings.";
  }
  
  return errorMsg;
};

const getAi = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
};

apiRouter.post("/generate-wiki-files", async (req: Request, res: Response) => {
  try {
    const { files } = req.body;
    const ai = getAi();
    const fileParts = files.map((file: any) => {
      const base64Data = file.data.includes('base64,') 
        ? file.data.split('base64,')[1] 
        : file.data;
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };
    });

    const prompt = `
      You are an expert technical writer known for extreme clarity and exhaustive detail. 
      Analyze the materials and create a massive Wiki entry that is both simple and deep.
      
      CRITICAL INSTRUCTIONS:
      1. EXHAUSTIVE COVERAGE: Leave no detail behind. If a concept is in the source, explain it thoroughly.
      2. ABSOLUTELY NO ANALOGIES: Do not use "it's like a..." or any metaphors. Explain the concepts directly for what they are.
      3. SIMPLIFIED PROSE: Use plain, easy-to-understand words. Avoid jargon where a simple word suffices.
      4. CONCISE SENTENCES: Keep sentences short and direct. No fluff or flowery introductions.
      5. FORMATTING: Use clean Markdown. Bold (**term**) core concepts.
      6. GLOSSARY: Provide a glossary of all the bolded core concepts, explaining terminologies shortly and well.
      
      Return ONLY raw JSON according to the schema.
    `;

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
      }
    });

    const data = parseGeminiResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    const msg = handleApiError(error, "Failed to generate wiki from files");
    res.status(500).json({ error: msg });
  }
});

apiRouter.post("/generate-wiki-topic", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    const ai = getAi();
    
    const prompt = `
      Generate an exhaustive, highly detailed Wiki for the topic or YouTube video URL.
      Topic/URL: "${topic}"
      
      CRITICAL INSTRUCTIONS:
      1. FACTUAL DEPTH: Provide a massive amount of detail. 5-7 long paragraphs per section.
      2. NO ANALOGIES: Strictly avoid metaphors or analogies. Stick to direct, literal explanations.
      3. SIMPLE LANGUAGE: Explain complex parts using the simplest factual language possible.
      4. NEAT FORMATTING: Use headings and bolding (**term**) for readability.
      5. GLOSSARY: Provide a glossary of all the bolded core concepts, explaining terminologies shortly and well.
      
      If it's a YouTube URL, extract meaningful conclusions, summarize the video into a rich, structured textual wiki guide.
      Return ONLY raw JSON according to the schema.
    `;

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
      }
    });

    const data = parseGeminiResponse(response.text);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    const msg = handleApiError(error, "Failed to generate wiki from topic");
    res.status(500).json({ error: msg });
  }
});

apiRouter.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages, wikiContext } = req.body;
    const ai = getAi();
    
    const systemInstruction = `You are a helpful study assistant inside TinyWiki. 
      You are an expert on the current Wiki article context below.
      Answer the user's questions strictly based on the context.
      If they ask something outside the context, you can still answer but mention it's outside the provided wiki.
      Keep answers clear, concise, and helpful.

      wiki context:
      ---
      Title: ${wikiContext.title}
      Summary: ${wikiContext.summary}
      Sections:
      ${wikiContext.sections.map((s: any) => `\n## ${s.heading}\n${s.content}`).join('\n')}
      ---
      `;

    // Let's just stringify chat history and pass it in one prompt for simplicity
    const formattedChat = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    
    const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: `Chat History:\n${formattedChat}\n\nAnswer the user's last message.`,
       config: {
         systemInstruction,
         temperature: 0.7
       }
    });

    res.json({ text: response.text });
  } catch (error: any) {
     console.error(error);
     const msg = handleApiError(error, "Failed to get chat response");
     res.status(500).json({ error: msg });
  }
});
