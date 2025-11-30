<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TinyWiki

**TinyWiki** is an AI-powered application that transforms your disorganized documents (PDFs, images, slides, notes) into structured, easy-to-read wiki entries. It leverages Google's Gemini 2.5 Flash model to analyze content, extract key information, and present it in a clean, educational format.

View your app in AI Studio: https://ai.studio/apps/drive/1cS-ux0rJS4dZd1DB3NGH7L5tL6hwUozZ

## Features

*   **Instant Clarity**: Converts raw documents into plain English summaries.
*   **Deep Explanations**: Automatically elaborates on complex terms.
*   **Smart Citations**: Links claims back to their original source (e.g., specific slides or pages).
*   **Structured Output**: Generates a complete wiki with a table of contents, executive summary, sections, key takeaways, and related topics.
*   **Multi-Format Support**: Accepts PDF and Image files.
*   **Shareable Links**: Create links to your generated wikis to share with others.

## Architecture Overview

The application is built using **React** and **TypeScript**, utilizing **Vite** for fast development and bundling.

*   **`App.tsx`**: The main controller component that manages the application state (`IDLE`, `PROCESSING`, `VIEWING`, `ERROR`) and orchestrates the flow.
*   **`services/geminiService.ts`**: Handles interactions with the Google GenAI SDK. It prepares file data and prompts the Gemini model to generate the wiki content based on a defined JSON schema.
*   **`components/`**: Contains the UI building blocks:
    *   `HeroSection`: The landing page for file uploads.
    *   `WikiRenderer`: The core component that displays the generated wiki content.
    *   `LoadingScreen`: Provides feedback during AI processing.
    *   `Button`: A reusable button component.
*   **`types.ts`**: Defines the TypeScript interfaces for the application data structures, including the wiki format and file handling.

## Run Locally

**Prerequisites:** Node.js (v18+ recommended)

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure API Key:**
    Create a `.env.local` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
    *Note: The code currently references `process.env.API_KEY`. Ensure your environment variable matches or update the code in `services/geminiService.ts` accordingly if using `VITE_` prefix conventions for Vite.*

3.  **Run the app:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

## Usage Guide

1.  **Upload Documents**: On the home screen, drag and drop your files (PDFs, images) or click "Select Documents".
2.  **Wait for Processing**: The AI will analyze your files. This may take a few moments depending on the file size and complexity.
3.  **Explore the Wiki**: Once generated, you can read the summary, navigate sections using the sidebar, and see key takeaways.
4.  **Share or Export**: Use the buttons in the sidebar to copy a shareable link or export the wiki as a PDF.
