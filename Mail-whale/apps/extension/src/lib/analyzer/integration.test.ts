import { describe, it, expect } from "vitest";
import { analyzeStyle } from "./style-analyzer";
import type { RawEmail } from "../email/types";

describe("Style Analyzer Integration", () => {
  it("handles diverse email styles correctly", () => {
    const formalEmails: RawEmail[] = Array.from({ length: 10 }, (_, i) => ({
      id: `f${i}`,
      threadId: `tf${i}`,
      subject: `Re: Q${i + 1} Report`,
      from: "me@corp.com",
      to: ["ceo@corp.com"],
      body: `Dear Mr. Johnson,\n\nPlease find attached the quarterly report for your review. I have included all relevant financial data and projections for the upcoming fiscal period.\n\nShould you require any additional information, please do not hesitate to reach out.\n\nBest regards,\nAaron McBride`,
      date: `2026-01-${String(i + 1).padStart(2, "0")}T09:00:00Z`,
      snippet: "Please find attached",
    }));

    const profile = analyzeStyle(formalEmails);

    expect(profile.formality).toBeGreaterThanOrEqual(5);
    expect(profile.greetings[0]).toBe("Dear");
    expect(profile.signOffs).toContain("Best regards");
    expect(profile.avgWordsPerSentence).toBeGreaterThan(5);
  });

  it("handles casual email styles correctly", () => {
    const casualEmails: RawEmail[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      threadId: `tc${i}`,
      subject: `Re: hangout`,
      from: "me@gmail.com",
      to: ["friend@gmail.com"],
      body: `Hey!\n\nYeah let's do it. I'm free after 5.\n\nLater`,
      date: `2026-01-${String(i + 1).padStart(2, "0")}T18:00:00Z`,
      snippet: "Yeah let's do it",
    }));

    const profile = analyzeStyle(casualEmails);

    expect(profile.formality).toBeLessThanOrEqual(5);
    expect(profile.greetings[0]).toBe("Hey");
    expect(profile.contractionRate).toBeGreaterThan(0);
  });
});
