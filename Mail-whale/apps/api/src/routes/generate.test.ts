import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index.js";
import { signToken } from "../lib/auth.js";

// Mock Prisma
vi.mock("../lib/db.js", () => ({
  db: {
    generation: {
      create: vi.fn().mockResolvedValue({ id: "gen-123" }),
    },
  },
}));

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Hey Bob,\n\nSounds great!\n\nCheers,\nAaron" }],
      }),
    };
  },
}));

describe("POST /generate", () => {
  const token = signToken({ userId: "user-1", email: "test@example.com" });

  it("returns a generated draft", async () => {
    const res = await app.request("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        styleProfile: {
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
          vocabularyFingerprint: [],
          questionRatio: 0.2,
          emailsAnalyzed: 50,
          lastUpdated: "2026-01-01T00:00:00Z",
        },
        exampleEmails: [],
        threadContext: [
          {
            from: "bob@example.com",
            to: ["me@example.com"],
            subject: "Lunch?",
            body: "Want to grab lunch?",
            date: "2026-01-20T12:00:00Z",
          },
        ],
        mode: "reply",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft).toBeTruthy();
    expect(body.generationId).toBe("gen-123");
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });
});
