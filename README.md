# TinyWiki

TinyWiki is an AI-powered application that generates exhaustive, structured, and beautifully formatted Wikipedia-style articles from a topic, YouTube video URL, or uploaded files. It uses the Gemini 2.5 Flash API to process information and synthesise complex concepts into manageable, easy-to-read knowledge bases — complete with a glossary, key points, and a built-in AI study assistant.

## Features

- **Topic or File to Wiki** — Enter a topic, paste a YouTube link, or upload documents (PDF, DOCX, PPTX, TXT, images) to generate a comprehensive wiki.
- **Deep & Exhaustive Analysis** — Powered by Gemini 2.5 Flash; content is detailed while maintaining plain, simplified language.
- **Auto-Generated Glossary** — Automatically detects and extracts core terminologies, providing a dedicated glossary section with inline hover tooltips.
- **Built-in AI Study Assistant** — Chat directly with your generated wiki. Ask questions, request summaries, or clarify specific points.
- **Structured Sections** — Content is broken into readable sections with headings, detailed explanations, key takeaways, and source citations.
- **History / Library** — All generated wikis are saved locally and searchable from the Library page.
- **Share Links** — Copy a shareable URL that encodes the full wiki for others to view instantly.
- **Read Aloud (TTS)** — Listen to any section using the browser's built-in speech synthesis.
- **PDF Downloads** — Download styled PDF copies of wikis directly. PDFs are rendered from HTML with headless Chromium, so their text remains selectable and searchable.
- **Print Support** — A separate print stylesheet remains available for browser printing.
- **Clean Aesthetic** — Minimal, premium UI built with Tailwind CSS, DM Serif Display, and Inter typography.

## Architecture

TinyWiki is a React application with a small serverless PDF-rendering endpoint:

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS (CDN) |
| AI Integration | `@google/genai` SDK (Gemini 2.5 Flash) — runs in the browser |
| Persistence | `localStorage` (no backend required) |
| PDF export | Vercel Node.js function with Puppeteer Core and serverless Chromium |
| Icons | Inline SVG (no icon library dependency) |

> **Security Note:** The Gemini API key is used client-side. For production deployments, restrict the key to specific domains in the [Google Cloud Console](https://console.cloud.google.com/) or proxy requests through a backend/serverless function.

PDF downloads use the `api/export-pdf.js` serverless function and require a host that supports Vercel-style Node.js functions. The Vite development server wires the same endpoint for local testing; Vite's static preview server does not run serverless functions.

## Setup and Installation

### Prerequisites

- Node.js v22.17+
- A Google Gemini API Key ([get one free](https://aistudio.google.com/apikey))

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Harbhite/TinyWiki.git
   cd TinyWiki
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Add your Gemini API key to `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production builds:
   ```bash
   npm run build
   npm run start
   ```

## Usage

1. Open the application in your browser (default: `http://localhost:3000`).
2. Enter a topic, a subject area, or a YouTube URL — **or** drag and drop a document.
3. Click **Generate** and wait for the wiki to be crafted.
4. Browse the generated wiki, explore the glossary, and use the **QA Chat** button to ask questions about the article.
5. Use **PDF** to download a styled, text-selectable PDF directly; use **Print** only when you want the browser's print dialog. Use **Share** to copy a link or visit the **Library** to revisit past wikis.

## License

MIT
