# TinyWiki

TinyWiki is a full-stack, AI-powered application that generates exhaustive, structured, and beautifully formatted Wikipedia-style articles from a topic, YouTube video URL, or uploaded files. It uses the Gemini 2.5 Flash API to process information and synthesize complex concepts into manageable, easy-to-read knowledge bases, complete with a glossary, key points, and a built-in AI study assistant.

## Features

- **Topic or File to Wiki**: Enter a topic, paste a YouTube link, or upload documents (PDF, DOCX, TXT) to generate a comprehensive wiki.
- **Deep & Exhaustive Analysis**: Powered by Gemini 2.5 Flash, the generated content is incredibly detailed while maintaining a plain and simplified language.
- **Auto-Generated Glossary**: Automatically detects and extracts core terminologies, providing a dedicated glossary section with clear definitions.
- **Built-in AI Study Assistant**: Chat directly with your generated wiki context. Ask questions, request summaries, or clarify specific points from the information provided.
- **Structured Sections**: Content is broken down into easily readable sections with main headings, detailed explanations, key takeaways, and source citations.
- **Clean Aesthetic**: A beautiful, minimal, and premium UI crafted with Tailwind CSS (`Cosmic Slate Theme` paired with earthy tones and serif typography).

## Architecture

This project is built using a modern frontend architecture:

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React (for icons)
- **AI Integration**: `@google/genai` TypeScript SDK (Gemini 2.5 Flash) running client-side

> **Warning**: This architecture currently initializes the Gemini API in the browser. For production deployments on Vercel or similar platforms, you should ensure your API key has appropriate domain restrictions or move the implementation to a backend/serverless function.

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root of your project and add your Gemini API Key using the `VITE_` prefix:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. For production builds:
   ```bash
   npm run build
   ```

## Usage

1. Open the application in your browser.
2. Under "Create New Wiki", enter a topic, a subject area, or a YouTube URL. Or, drag and drop support documents to base the wiki on.
3. Click "Generate Wiki" (or let it process uploaded files).
4. Browse the generated wiki, review the glossary, and interact with the AI assistant through the chat tab for any questions regarding the article. 

## License
MIT
