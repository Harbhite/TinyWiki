export interface WikiSection {
  heading: string;
  content: string; // Markdown content
  keyPoints: string[];
  citations: string[];
}

export interface WikiGlossaryItem {
  term: string;
  definition: string;
}

export interface WikiData {
  title: string;
  summary: string;
  readingTimeMinutes: number;
  sections: WikiSection[];
  relatedTopics: string[];
  glossary?: WikiGlossaryItem[];
}

export interface FileData {
  name: string;
  type: string;
  data: string; // Base64
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  VIEWING = 'VIEWING',
  ERROR = 'ERROR',
  ABOUT = 'ABOUT',
  FEATURES = 'FEATURES',
  HISTORY = 'HISTORY'
}