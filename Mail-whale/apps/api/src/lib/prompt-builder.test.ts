import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt-builder.js";
import type {
  StyleProfile,
  ExampleEmail,
  ThreadMessage,
  GenerationPreferences,
} from "@mail-whale/types";

const mockProfile: StyleProfile = {
  greetings: ["Hey"],
  signOffs: ["Cheers"],
  avgWordsPerSentence: 12,
  avgSentencesPerParagraph: 2,
  avgParagraphsPerEmail: 3,
  emojiRate: 0,
  contractionRate: 0.08,
  formality: 3,
  directness: 7,
  warmth: 7,
  structurePreference: "prose",
  vocabularyFingerprint: ["definitely", "awesome", "quick"],
  questionRatio: 0.2,
  emailsAnalyzed: 50,
  lastUpdated: "2026-01-01T00:00:00Z",
};

const mockExamples: ExampleEmail[] = [
  {
    subject: "Re: Meeting",
    body: "Hey Bob,\n\nSounds good, let's do 3pm.\n\nCheers,\nAaron",
    date: "2026-01-15T10:00:00Z",
  },
];

const mockThread: ThreadMessage[] = [
  {
    from: "bob@example.com",
    to: ["me@example.com"],
    subject: "Lunch tomorrow?",
    body: "Hey, want to grab lunch tomorrow?",
    date: "2026-01-20T12:00:00Z",
  },
];

describe("buildPrompt", () => {
  it("includes style profile data in system prompt", () => {
    const { system, user } = buildPrompt({
      styleProfile: mockProfile,
      exampleEmails: mockExamples,
      threadContext: mockThread,
      mode: "reply",
    });

    expect(system).toContain("Hey");
    expect(system).toContain("Cheers");
    expect(system).toContain("casual");
    expect(user).toContain("Lunch tomorrow?");
  });

  it("includes tone adjustment when provided", () => {
    const { system } = buildPrompt({
      styleProfile: mockProfile,
      exampleEmails: mockExamples,
      threadContext: mockThread,
      mode: "reply",
      preferences: { toneAdjust: 2, length: "brief" },
    });

    expect(system).toContain("more formal");
    expect(system).toContain("Keep it short");
  });

  it("handles new email mode", () => {
    const { user } = buildPrompt({
      styleProfile: mockProfile,
      exampleEmails: mockExamples,
      threadContext: [],
      mode: "new",
      newEmailPrompt: "follow up on the meeting",
    });

    expect(user).toContain("follow up on the meeting");
  });
});
