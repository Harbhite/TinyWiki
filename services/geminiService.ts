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
  const response = await fetch("/api/generate-wiki-files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  
  const textBody = await response.text();
  let data;
  try {
    data = JSON.parse(textBody);
  } catch (e) {
    console.error("Non-JSON response from server:", textBody);
    throw new Error("The server experienced an issue and returned an invalid format. Please try again.");
  }
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate wiki from files");
  }
  
  return data;
};

export const generateWikiFromTopic = async (topic: string): Promise<WikiData> => {
  const response = await fetch("/api/generate-wiki-topic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  
  const textBody = await response.text();
  let data;
  try {
    data = JSON.parse(textBody);
  } catch (e) {
    console.error("Non-JSON response from server:", textBody);
    throw new Error("The server experienced an issue and returned an invalid format. Please try again.");
  }
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate wiki from topic");
  }

  return data;
};

export const chatWithWiki = async (messages: {role: string, content: string}[], wikiContext: WikiData) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, wikiContext }),
  });
  
  const textBody = await response.text();
  let data;
  try {
    data = JSON.parse(textBody);
  } catch (e) {
    console.error("Non-JSON response from server:", textBody);
    throw new Error("The server experienced an issue and returned an invalid format. Please try again.");
  }
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to get chat response");
  }

  return data;
};