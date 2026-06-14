export interface WikiSection {
  heading: string;
  content: string; // Markdown content
  keyPoints: string[];
  citations: string[];
  criticalPerspectives?: string[]; // Feature 3: Devil's Advocate
}

export interface WikiGlossaryItem {
  term: string;
  definition: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  type: string; // e.g., 'term', 'section', 'relatedTopic'
  wikiSectionId?: number; // Link to a specific section
}

export interface ConceptEdge {
  source: string;
  target: string;
  relation: string; // e.g., 'explains', 'relatedTo', 'contradicts'
}

export interface LiveResource {
  title: string;
  url: string;
  source: string; // e.g., 'News', 'Research Paper', 'YouTube'
  date: string;
  summary: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
  description: string;
  executable: boolean;
}

export interface MathExpression {
  latex: string;
  description: string;
  interactive: boolean;
}

export interface Annotation {
  id: string;
  userId: string;
  timestamp: number;
  text: string; // The annotated text
  note: string; // The user's note
  sectionId: number; // The section where the annotation was made
}

export interface HistoricalContext {
  year: number;
  summary: string;
  wikiVariant?: WikiData; // A simplified WikiData for that era
}

export interface WikiData {
  title: string;
  summary: string;
  readingTimeMinutes: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  cognitiveLevel?: 'Basic' | 'Standard' | 'Advanced'; // Feature 1: Cognitive Load Personalization
  audioSummaryUrl?: string; // Feature 4: Audio Briefings
  sections: WikiSection[];
  relatedTopics: string[];
  glossary?: WikiGlossaryItem[];
  conceptMapNodes?: ConceptNode[]; // Feature 2: Dynamic Concept Mapping
  conceptMapEdges?: ConceptEdge[]; // Feature 2: Dynamic Concept Mapping
  liveResources?: LiveResource[]; // Feature 6: Real-Time Web Augmentation
  codeSnippets?: CodeSnippet[]; // Feature 7: Interactive Code & Math Sandboxes
  mathExpressions?: MathExpression[]; // Feature 7: Interactive Code & Math Sandboxes
  historicalContexts?: HistoricalContext[]; // Feature 12: Time-Travel
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
  HISTORY = 'HISTORY',
  FLASHCARDS = 'FLASHCARDS', // New state for flashcards
  CONCEPT_MAP = 'CONCEPT_MAP', // New state for concept map
  SOCRATIC_QA = 'SOCRATIC_QA', // New state for Socratic Q&A
  TIME_TRAVEL = 'TIME_TRAVEL', // New state for Time-Travel
}

export interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options?: string[]; // For multiple choice
  wikiSectionId?: number; // Link to relevant section for review
}

export interface QuizSession {
  questions: QuizQuestion[];
  userAnswers: { [questionId: string]: string };
  score: number;
  feedback: string; // AI-generated feedback
}

export interface InfographicData {
  type: 'timeline' | 'hierarchy' | 'process';
  title: string;
  elements: any[]; // Specific structure depends on type
}

export interface ZettelkastenNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sourceWikiId: string;
  relatedNotes: string[];
}
