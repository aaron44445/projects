export interface StyleProfile {
  /** Greeting patterns ranked by frequency, e.g. ["Hey", "Hi {name}", "Hello"] */
  greetings: string[];
  /** Sign-off patterns ranked by frequency, e.g. ["Best", "Cheers", "Thanks"] */
  signOffs: string[];
  /** Average words per sentence */
  avgWordsPerSentence: number;
  /** Average sentences per paragraph */
  avgSentencesPerParagraph: number;
  /** Average paragraphs per email */
  avgParagraphsPerEmail: number;
  /** Emoji usage rate (0-1, where 0 = never, 1 = every email) */
  emojiRate: number;
  /** Contraction usage rate (0-1) */
  contractionRate: number;
  /** Question-to-statement ratio (0-1) */
  questionRatio: number;
  /** Formality level (1-10, 1 = very casual, 10 = very formal) */
  formality: number;
  /** Directness level (1-10, 1 = indirect/hedging, 10 = very direct) */
  directness: number;
  /** Warmth level (1-10, 1 = cold/professional, 10 = warm/friendly) */
  warmth: number;
  /** Structure preference: prose, bullets, numbered, or mixed */
  structurePreference: "prose" | "bullets" | "numbered" | "mixed";
  /** Frequently used words/phrases unique to this user */
  vocabularyFingerprint: string[];
  /** Total emails analyzed to build this profile */
  emailsAnalyzed: number;
  /** ISO timestamp of last profile update */
  lastUpdated: string;
}
