import type { StyleProfile } from "./style-profile.js";

export interface GenerateRequest {
  /** The user's style profile */
  styleProfile: StyleProfile;
  /** 3-5 example emails from the user for few-shot context */
  exampleEmails: ExampleEmail[];
  /** The email thread the user wants to reply to */
  threadContext: ThreadMessage[];
  /** Optional user preferences for this generation */
  preferences?: GenerationPreferences;
  /** "reply" or "new" */
  mode: "reply" | "new";
  /** Brief prompt for "new" mode, e.g. "follow up on the meeting" */
  newEmailPrompt?: string;
}

export interface ExampleEmail {
  subject: string;
  body: string;
  /** ISO timestamp */
  date: string;
}

export interface ThreadMessage {
  from: string;
  to: string[];
  subject: string;
  body: string;
  date: string;
}

export interface GenerationPreferences {
  /** Tone adjustment relative to default: -3 (more casual) to +3 (more formal) */
  toneAdjust: number;
  /** Desired length: "brief" | "standard" | "detailed" */
  length: "brief" | "standard" | "detailed";
}

export interface GenerateResponse {
  draft: string;
  /** Unique ID for this generation (for feedback/regenerate) */
  generationId: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
