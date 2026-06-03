import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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

const parseGeminiResponse = (text: string | undefined) => {
  if (!text) throw new Error("No response received from the AI.");
  
  let cleanText = text.trim();
  
  // Remove markdown code block wrapping if present
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limits for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post("/api/generate-wiki-files", async (req, res) => {
    try {
      const { files } = req.body;
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
        
        Return ONLY raw JSON according to the schema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          role: 'user',
          parts: [{ text: prompt }, ...fileParts]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: wikiSchema,
          temperature: 0.1,
          tools: [{ googleSearch: {} }],
        }
      });

      const data = parseGeminiResponse(response.text);
      res.json(data);
    } catch (error: any) {
      console.error(error);
      const msg = error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")
        ? "You have exceeded your Gemini API usage quota. Please check your API key billing details or try again later."
        : error.message || "Failed to generate wiki from files";
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/generate-wiki-topic", async (req, res) => {
    try {
      const { topic } = req.body;
      
      const prompt = `
        Generate an exhaustive, highly detailed Wiki for the topic or YouTube video URL.
        Topic/URL: "${topic}"
        
        CRITICAL INSTRUCTIONS:
        1. FACTUAL DEPTH: Provide a massive amount of detail. 5-7 long paragraphs per section.
        2. NO ANALOGIES: Strictly avoid metaphors or analogies. Stick to direct, literal explanations.
        3. SIMPLE LANGUAGE: Explain complex parts using the simplest factual language possible.
        4. NEAT FORMATTING: Use headings and bolding for readability.
        
        If it's a YouTube URL, extract meaningful conclusions, summarize the video into a rich, structured textual wiki guide.
        Return ONLY raw JSON according to the schema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: wikiSchema,
          temperature: 0.2, 
          tools: [{ googleSearch: {} }],
        }
      });

      const data = parseGeminiResponse(response.text);
      res.json(data);
    } catch (error: any) {
      console.error(error);
      const msg = error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")
        ? "You have exceeded your Gemini API usage quota. Please check your API key billing details or try again later."
        : error.message || "Failed to generate wiki from topic";
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, wikiContext } = req.body;
      
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

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      // Pass previous context to the turn
      for (let i = 0; i < messages.length - 1; i++) {
         const msg = messages[i];
         // For server-side chat interface, we might need a workaround for building history if supported. 
         // But the easiest way is just to pass the latest message and all history in the contents or use sendMessage
      }
      
      // Let's just stringify chat history and pass it in one prompt for simplicity
      const formattedChat = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      
      const response = await ai.models.generateContent({
         model: 'gemini-3.5-flash',
         contents: `Chat History:\n${formattedChat}\n\nAnswer the user's last message.`,
         config: {
           systemInstruction,
           temperature: 0.7
         }
      });

      res.json({ text: response.text });
    } catch (error: any) {
       console.error(error);
       const msg = error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")
        ? "You have exceeded your Gemini API usage quota. Please check your API key billing details or try again later."
        : error.message || "Failed to get chat response";
       res.status(500).json({ error: msg });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Important: For express 4, it's app.get('*', ...)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
