import { describe, it, expect } from "vitest";
import {
  splitSentences,
  splitParagraphs,
  countWords,
  extractGreeting,
  extractSignOff,
  contractionRate,
  emojiRate,
  questionRatio,
  hasBullets,
  hasNumberedList,
} from "./text-utils";

describe("splitSentences", () => {
  it("splits simple sentences", () => {
    const result = splitSentences("Hello world. How are you? I am fine!");
    expect(result).toEqual(["Hello world.", "How are you?", "I am fine!"]);
  });

  it("returns empty array for empty string", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   ")).toEqual([]);
  });

  it("handles single sentence", () => {
    const result = splitSentences("Just one sentence.");
    expect(result).toEqual(["Just one sentence."]);
  });

  it("treats double newlines as sentence breaks", () => {
    const result = splitSentences("First paragraph\n\nSecond paragraph");
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe("splitParagraphs", () => {
  it("splits on double newlines", () => {
    const result = splitParagraphs("Para one.\n\nPara two.\n\nPara three.");
    expect(result).toEqual(["Para one.", "Para two.", "Para three."]);
  });

  it("returns empty array for empty string", () => {
    expect(splitParagraphs("")).toEqual([]);
  });

  it("returns single paragraph when no breaks", () => {
    expect(splitParagraphs("Just one paragraph.")).toEqual([
      "Just one paragraph.",
    ]);
  });
});

describe("countWords", () => {
  it("counts words in a sentence", () => {
    expect(countWords("Hello world")).toBe(2);
    expect(countWords("The quick brown fox jumps")).toBe(5);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("handles multiple spaces", () => {
    expect(countWords("Hello   world")).toBe(2);
  });
});

describe("extractGreeting", () => {
  it("extracts Hey greeting", () => {
    expect(extractGreeting("Hey John,\nHow are you?")).toBe("Hey");
  });

  it("extracts Hi greeting", () => {
    expect(extractGreeting("Hi there,\nJust checking in.")).toBe("Hi");
  });

  it("extracts Hello greeting", () => {
    expect(extractGreeting("Hello team,\nPlease review.")).toBe("Hello");
  });

  it("extracts Dear greeting", () => {
    expect(extractGreeting("Dear Mr. Smith,\nI am writing to...")).toBe("Dear");
  });

  it("returns null when no greeting", () => {
    expect(extractGreeting("Please find attached the report.")).toBeNull();
  });

  it("is case insensitive", () => {
    expect(extractGreeting("hey there")).toBe("hey");
  });
});

describe("extractSignOff", () => {
  it("extracts Best sign-off", () => {
    expect(extractSignOff("Thanks for your help.\n\nBest,\nJohn")).toBe("Best");
  });

  it("extracts Cheers sign-off", () => {
    expect(extractSignOff("See you then.\n\nCheers,\nJane")).toBe("Cheers");
  });

  it("extracts Thanks sign-off", () => {
    expect(extractSignOff("Please review.\n\nThanks,")).toBe("Thanks");
  });

  it("extracts Best regards sign-off", () => {
    expect(
      extractSignOff("Let me know.\n\nBest regards,\nAlex")
    ).toBe("Best regards");
  });

  it("returns null when no sign-off", () => {
    expect(extractSignOff("Just a message with no sign off")).toBeNull();
  });
});

describe("contractionRate", () => {
  it("calculates rate of contractions", () => {
    const text = "I'm going to the store. I don't need help.";
    const rate = contractionRate(text);
    // 2 contractions out of 10 words = 0.2
    expect(rate).toBeCloseTo(0.2, 1);
  });

  it("returns 0 for no contractions", () => {
    expect(contractionRate("I am going to the store")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(contractionRate("")).toBe(0);
  });
});

describe("emojiRate", () => {
  it("calculates rate of emoji usage", () => {
    const text = "Hello \u{1F600} how are you \u{1F44D}";
    const rate = emojiRate(text);
    // 2 emojis out of ~5 words
    expect(rate).toBeGreaterThan(0);
  });

  it("returns 0 for no emojis", () => {
    expect(emojiRate("Hello world, no emojis here")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(emojiRate("")).toBe(0);
  });
});

describe("questionRatio", () => {
  it("calculates ratio of questions", () => {
    const text = "How are you? I am fine. What about you?";
    const ratio = questionRatio(text);
    // 2 questions out of 3 sentences
    expect(ratio).toBeCloseTo(2 / 3, 1);
  });

  it("returns 0 for no questions", () => {
    expect(questionRatio("I am fine. Everything is good.")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(questionRatio("")).toBe(0);
  });
});

describe("hasBullets", () => {
  it("detects bullet points with dash", () => {
    expect(hasBullets("Items:\n- Item one\n- Item two")).toBe(true);
  });

  it("detects bullet points with asterisk", () => {
    expect(hasBullets("Items:\n* Item one\n* Item two")).toBe(true);
  });

  it("returns false when no bullets", () => {
    expect(hasBullets("Just a normal paragraph.")).toBe(false);
  });
});

describe("hasNumberedList", () => {
  it("detects numbered lists with period", () => {
    expect(hasNumberedList("Steps:\n1. First\n2. Second")).toBe(true);
  });

  it("detects numbered lists with parenthesis", () => {
    expect(hasNumberedList("Steps:\n1) First\n2) Second")).toBe(true);
  });

  it("returns false when no numbered list", () => {
    expect(hasNumberedList("Just a normal paragraph.")).toBe(false);
  });
});
