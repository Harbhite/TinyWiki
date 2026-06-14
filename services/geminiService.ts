import { GoogleGenAI, Type } from "@google/genai";
import { FileData, WikiData } from "../types";

// NOTE: The Gemini API key is used client-side. Restrict it to specific
// domains in the Google Cloud Console for production deployments.
const getAi = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set. Please add it to your .env file."
    );
  }
  return new GoogleGenAI({ apiKey });
};

const processFile = (file: FileData) => {
  const base64Data = file.data.includes("base64,")
    ? file.data.split("base64,")[1]
    : file.data;

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type || "application/octet-stream",
    },
  };
};

const wikiSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A clear, professional title for the Wiki.",
    },
    summary: {
      type: Type.STRING,
      description:
        "A comprehensive summary (approx 150-200 words) that explains the core concepts using plain, direct language. No analogies.",
    },
    readingTimeMinutes: {
      type: Type.NUMBER,
      description: "Calculated reading time in minutes.",
    },
    // Feature 5: Difficulty badge — AI assigns one of three levels
    difficulty: {
      type: Type.STRING,
      description:
        "Estimated difficulty level of the topic for a general audience. Must be exactly one of: 'Beginner', 'Intermediate', or 'Advanced'.",
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: "Direct and descriptive section heading.",
          },
          content: {
            type: Type.STRING,
            description:
              "Exhaustive, long-form explanation in Markdown. Use simplified language and short, punchy sentences. Go straight to the point. DO NOT use analogies or metaphors. Each section should be very detailed (5-7 paragraphs) but purely factual and clear. Bold key terms (**term**).",
          },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 direct, simplified takeaways that summarize the facts.",
          },
          citations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Source markers (e.g., 'Page 4', 'Slide 7').",
          },
        },
        required: ["heading", "content", "keyPoints", "citations"],
      },
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Directly related topics for further study.",
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: {
            type: Type.STRING,
            description: "The core terminology.",
          },
          definition: {
            type: Type.STRING,
            description:
              "A short, perfectly clear explanation/definition of the term.",
          },
        },
        required: ["term", "definition"],
      },
      description:
        "A list of important terminologies used in the wiki and their short, well-explained definitions.",
    },
  },
  required: [
    "title",
    "summary",
    "sections",
    "readingTimeMinutes",
    "difficulty",
    "relatedTopics",
    "glossary",
  ],
};

const parseGeminiResponse = (text: string | undefined): WikiData => {
  if (!text) throw new Error("No response received from the AI.");

  let cleanText = text.trim();

  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }

  const firstBrace = cleanText.indexOf("{");
  const lastBrace = cleanText.lastIndexOf("}");

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

const handleApiError = (error: any, defaultMsg: string): never => {
  let errorMsg: string = defaultMsg;

  if (error?.message) {
    errorMsg = error.message;
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch (_) {
      // Not a JSON error body — use the raw message
    }
  }

  if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
    throw new Error(
      "You have exceeded your Gemini API usage quota. Please check your API key billing details or try again later."
    );
  }
  if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE")) {
    throw new Error(
      "The AI is currently experiencing high demand. Please try again in a few moments."
    );
  }
  if (
    (errorMsg.includes("400") || errorMsg.includes("401")) &&
    (errorMsg.includes("API key not valid") ||
      errorMsg.includes("API_KEY_INVALID"))
  ) {
    throw new Error(
      "Your Gemini API key is invalid. Please check your .env file."
    );
  }

  throw new Error(errorMsg);
};

export const generateWikiFromFiles = async (
  files: FileData[]
): Promise<WikiData> => {
  try {
    const ai = getAi();
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
      7. DIFFICULTY: Assess the overall difficulty of the topic as 'Beginner', 'Intermediate', or 'Advanced'.
      Return ONLY raw JSON according to the schema.
    `;
    const fileParts = files.map(processFile);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [{ text: prompt }, ...fileParts],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: wikiSchema,
        temperature: 0.1,
      },
    });
    return parseGeminiResponse(response.text);
  } catch (error: any) {
    console.error(error);
    handleApiError(error, "Failed to generate wiki from files.");
    throw error;
  }
};

export const generateWikiFromTopic = async (
  topic: string
): Promise<WikiData> => {
  try {
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
      6. DIFFICULTY: Assess the overall difficulty of the topic as 'Beginner', 'Intermediate', or 'Advanced'.
      If it's a YouTube URL, extract meaningful conclusions, summarize the video into a rich, structured textual wiki guide.
      Return ONLY raw JSON according to the schema.
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: wikiSchema,
        temperature: 0.2,
      },
    });
    return parseGeminiResponse(response.text);
  } catch (error: any) {
    console.error(error);
    handleApiError(error, "Failed to generate wiki from topic.");
    throw error;
  }
};

// Maximum number of recent chat turns to include in the prompt to avoid
// exceeding token limits on long conversations.
const MAX_CHAT_HISTORY_TURNS = 10;

export const chatWithWiki = async (
  messages: { role: string; content: string }[],
  wikiContext: WikiData
): Promise<{ text: string }> => {
  try {
    const ai = getAi();

    // Build a compact wiki context (title + summary + section headings + first 600 chars)
    // to stay well within token limits while preserving full semantic coverage.
    const compactContext = `
Title: ${wikiContext.title}
Summary: ${wikiContext.summary}
Sections:
${wikiContext.sections
  .map((s) => `## ${s.heading}\n${s.content.substring(0, 600)}...`)
  .join("\n\n")}
    `.trim();

    const systemInstruction = `You are a helpful study assistant inside TinyWiki.
You are an expert on the current Wiki article provided below.
Answer the user's questions based on this context.
If they ask something outside the context, you may still answer but note it is outside the provided wiki.
Keep answers clear, concise, and helpful.

Wiki Context:
---
${compactContext}
---`;

    // Trim to the most recent N turns to prevent runaway token growth
    const recentMessages = messages.slice(-MAX_CHAT_HISTORY_TURNS);
    const formattedChat = recentMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Chat History:\n${formattedChat}\n\nAnswer the user's last message.`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return { text: response.text ?? "I could not generate a response." };
  } catch (error: any) {
    console.error(error);
    handleApiError(error, "Failed to get chat response.");
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 1: Markdown Export
// Converts a WikiData object into a well-formatted Markdown document and
// triggers a browser download.
// ─────────────────────────────────────────────────────────────────────────────
export const exportWikiAsMarkdown = (data: WikiData): void => {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');

  if (data.difficulty) {
    lines.push(`> **Difficulty:** ${data.difficulty} &nbsp;|&nbsp; **Reading Time:** ${data.readingTimeMinutes} min`);
    lines.push('');
  } else {
    lines.push(`> **Reading Time:** ${data.readingTimeMinutes} min`);
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  lines.push(data.summary);
  lines.push('');
  lines.push('---');
  lines.push('');

  data.sections.forEach((section, idx) => {
    lines.push(`## ${String(idx + 1).padStart(2, '0')}. ${section.heading}`);
    lines.push('');
    lines.push(section.content);
    lines.push('');

    if (section.keyPoints && section.keyPoints.length > 0) {
      lines.push('### Key Points');
      lines.push('');
      section.keyPoints.forEach((point) => {
        lines.push(`- ${point}`);
      });
      lines.push('');
    }

    if (section.citations && section.citations.length > 0) {
      lines.push('### Sources');
      lines.push('');
      section.citations.forEach((cite) => {
        lines.push(`- ${cite}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  if (data.glossary && data.glossary.length > 0) {
    lines.push('## Glossary');
    lines.push('');
    const sorted = [...data.glossary].sort((a, b) => a.term.localeCompare(b.term));
    sorted.forEach((item) => {
      lines.push(`**${item.term}**`);
      lines.push(`  ${item.definition}`);
      lines.push('');
    });
    lines.push('---');
    lines.push('');
  }

  if (data.relatedTopics && data.relatedTopics.length > 0) {
    lines.push('## Related Topics');
    lines.push('');
    data.relatedTopics.forEach((topic) => {
      lines.push(`- ${topic}`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('*Generated by [TinyWiki](https://github.com/Harbhite/TinyWiki)*');

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
