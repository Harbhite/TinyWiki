/**
 * Represents a section within a generated wiki page.
 */
export interface WikiSection {
  /** The title of the section. */
  heading: string;
  /** The main content of the section, formatted in Markdown. */
  content: string; // Markdown content
  /** A list of key takeaway points for this section. */
  keyPoints: string[];
  /** A list of citations or references supporting the content of this section. */
  citations: string[];
}

/**
 * Represents the complete structure of a generated wiki page.
 */
export interface WikiData {
  /** The main title of the wiki entry. */
  title: string;
  /** A brief executive summary of the document's content. */
  summary: string;
  /** Estimated time in minutes required to read the wiki entry. */
  readingTimeMinutes: number;
  /** An array of sections that make up the body of the wiki. */
  sections: WikiSection[];
  /** A list of related topics for further exploration. */
  relatedTopics: string[];
}

/**
 * Represents a file selected by the user for processing.
 */
export interface FileData {
  /** The name of the file. */
  name: string;
  /** The MIME type of the file (e.g., 'application/pdf', 'image/png'). */
  type: string;
  /** The content of the file, typically encoded as a Base64 string. */
  data: string; // Base64
}

/**
 * Enumeration representing the various states of the application.
 */
export enum AppState {
  /** The initial state when the app is waiting for user input. */
  IDLE = 'IDLE',
  /** The state when the app is processing files and communicating with the AI service. */
  PROCESSING = 'PROCESSING',
  /** The state when the wiki content has been generated and is being displayed. */
  VIEWING = 'VIEWING',
  /** The state when an error has occurred during processing. */
  ERROR = 'ERROR'
}
