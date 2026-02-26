import { describe, it, expect } from "vitest";
import {
  analyzeStyle,
  emptyProfile,
  sortByFrequency,
  deriveFormality,
  deriveDirectness,
  deriveWarmth,
  deriveStructure,
  getVocabularyFingerprint,
  round,
  clamp,
} from "./style-analyzer";
import type { RawEmail } from "../email/types";

function makeEmail(body: string, overrides: Partial<RawEmail> = {}): RawEmail {
  return {
    id: overrides.id || "1",
    threadId: overrides.threadId || "t1",
    subject: overrides.subject || "Test Subject",
    from: overrides.from || "test@example.com",
    to: overrides.to || ["recipient@example.com"],
    body,
    date: overrides.date || "2024-01-01T00:00:00Z",
    snippet: overrides.snippet || body.slice(0, 50),
  };
}

describe("analyzeStyle", () => {
  it("returns empty profile for no emails", () => {
    const profile = analyzeStyle([]);
    expect(profile.emailsAnalyzed).toBe(0);
    expect(profile.greetings).toEqual([]);
    expect(profile.signOffs).toEqual([]);
    expect(profile.avgWordsPerSentence).toBe(0);
  });

  it("analyzes a single casual email", () => {
    const email = makeEmail(
      "Hey John,\n\nHow's it going? I'm just checking in to see if you're free this weekend. Let's grab coffee!\n\nCheers,"
    );
    const profile = analyzeStyle([email]);

    expect(profile.emailsAnalyzed).toBe(1);
    expect(profile.greetings).toContain("Hey");
    expect(profile.signOffs).toContain("Cheers");
    expect(profile.contractionRate).toBeGreaterThan(0);
    expect(profile.questionRatio).toBeGreaterThan(0);
    expect(profile.lastUpdated).toBeTruthy();
  });

  it("analyzes a single formal email", () => {
    const email = makeEmail(
      "Dear Mr. Smith,\n\nI am writing to inquire about the position advertised on your website. I have attached my resume for your review.\n\nSincerely,"
    );
    const profile = analyzeStyle([email]);

    expect(profile.emailsAnalyzed).toBe(1);
    expect(profile.greetings).toContain("Dear");
    expect(profile.signOffs).toContain("Sincerely");
    expect(profile.contractionRate).toBe(0);
  });

  it("analyzes multiple emails and aggregates", () => {
    const emails = [
      makeEmail("Hey,\n\nLet's do this. I'm in.\n\nCheers,", { id: "1" }),
      makeEmail("Hi,\n\nSounds good to me. I'll be there.\n\nThanks,", { id: "2" }),
      makeEmail("Hey,\n\nI'm on it. Don't worry.\n\nCheers,", { id: "3" }),
    ];
    const profile = analyzeStyle(emails);

    expect(profile.emailsAnalyzed).toBe(3);
    expect(profile.greetings.length).toBeGreaterThan(0);
    expect(profile.signOffs.length).toBeGreaterThan(0);
    // Hey appears twice, Hi once -> Hey should be first
    expect(profile.greetings[0]).toBe("Hey");
    // Cheers appears twice, Thanks once -> Cheers should be first
    expect(profile.signOffs[0]).toBe("Cheers");
  });

  it("detects structure preference", () => {
    const bulletEmails = Array.from({ length: 5 }, (_, i) =>
      makeEmail(
        "Hi,\n\nHere are the items:\n- First item\n- Second item\n- Third item\n\nThanks,",
        { id: String(i) }
      )
    );
    const profile = analyzeStyle(bulletEmails);
    expect(profile.structurePreference).toBe("bullets");
  });

  it("has valid formality/directness/warmth ranges", () => {
    const email = makeEmail("Hello,\n\nThis is a test email.\n\nBest,");
    const profile = analyzeStyle([email]);

    expect(profile.formality).toBeGreaterThanOrEqual(1);
    expect(profile.formality).toBeLessThanOrEqual(10);
    expect(profile.directness).toBeGreaterThanOrEqual(1);
    expect(profile.directness).toBeLessThanOrEqual(10);
    expect(profile.warmth).toBeGreaterThanOrEqual(1);
    expect(profile.warmth).toBeLessThanOrEqual(10);
  });
});

describe("emptyProfile", () => {
  it("returns valid empty profile", () => {
    const profile = emptyProfile();
    expect(profile.emailsAnalyzed).toBe(0);
    expect(profile.formality).toBe(5);
    expect(profile.directness).toBe(5);
    expect(profile.warmth).toBe(5);
    expect(profile.structurePreference).toBe("prose");
    expect(profile.lastUpdated).toBeTruthy();
  });
});

describe("sortByFrequency", () => {
  it("sorts entries by count descending", () => {
    const map = new Map([
      ["a", 3],
      ["b", 5],
      ["c", 1],
    ]);
    expect(sortByFrequency(map)).toEqual(["b", "a", "c"]);
  });

  it("handles empty map", () => {
    expect(sortByFrequency(new Map())).toEqual([]);
  });
});

describe("deriveFormality", () => {
  it("returns lower formality for high contraction rate", () => {
    const low = deriveFormality(0.2, 0, new Map());
    const high = deriveFormality(0, 0, new Map());
    expect(low).toBeLessThan(high);
  });

  it("returns lower formality for high emoji rate", () => {
    const low = deriveFormality(0, 0.1, new Map());
    const high = deriveFormality(0, 0, new Map());
    expect(low).toBeLessThan(high);
  });

  it("stays within 1-10 range", () => {
    const extreme = deriveFormality(0.5, 0.5, new Map());
    expect(extreme).toBeGreaterThanOrEqual(1);
    expect(extreme).toBeLessThanOrEqual(10);
  });
});

describe("deriveDirectness", () => {
  it("returns higher for short sentences", () => {
    const short = deriveDirectness(8, 0);
    const long = deriveDirectness(25, 0);
    expect(short).toBeGreaterThan(long);
  });

  it("returns lower for more questions", () => {
    const fewQs = deriveDirectness(15, 0.1);
    const manyQs = deriveDirectness(15, 0.8);
    expect(fewQs).toBeGreaterThan(manyQs);
  });
});

describe("deriveWarmth", () => {
  it("returns higher for warm greetings", () => {
    const warmGreetings = new Map([["Hey", 5]]);
    const coldGreetings = new Map([["Dear", 5]]);
    const warm = deriveWarmth(0, warmGreetings, new Map());
    const cold = deriveWarmth(0, coldGreetings, new Map());
    expect(warm).toBeGreaterThan(cold);
  });
});

describe("deriveStructure", () => {
  it("returns prose when mostly prose", () => {
    expect(deriveStructure(8, 1, 1)).toBe("prose");
  });

  it("returns bullets when mostly bullets", () => {
    expect(deriveStructure(1, 8, 1)).toBe("bullets");
  });

  it("returns numbered when mostly numbered", () => {
    expect(deriveStructure(1, 1, 8)).toBe("numbered");
  });

  it("returns mixed when moderate list usage", () => {
    expect(deriveStructure(5, 3, 2)).toBe("mixed");
  });

  it("returns prose for empty", () => {
    expect(deriveStructure(0, 0, 0)).toBe("prose");
  });
});

describe("getVocabularyFingerprint", () => {
  it("returns frequent non-stop words", () => {
    const freq = new Map([
      ["regarding", 10],
      ["synergy", 8],
      ["that", 20], // stop word
      ["deliverable", 5],
    ]);
    const result = getVocabularyFingerprint(freq, 10);
    expect(result).toContain("regarding");
    expect(result).toContain("synergy");
    expect(result).not.toContain("that");
  });

  it("limits to 20 entries", () => {
    const freq = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      freq.set(`word${i}xxxx`, 10); // > 3 chars, not stop word
    }
    const result = getVocabularyFingerprint(freq, 10);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe("round", () => {
  it("rounds to specified decimal places", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.2355, 2)).toBe(1.24);
    expect(round(1.5, 0)).toBe(2);
  });
});

describe("clamp", () => {
  it("clamps to min", () => {
    expect(clamp(-5, 1, 10)).toBe(1);
  });

  it("clamps to max", () => {
    expect(clamp(15, 1, 10)).toBe(10);
  });

  it("leaves value in range unchanged", () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });
});
