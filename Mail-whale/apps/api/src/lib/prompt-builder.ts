import type {
  StyleProfile,
  ExampleEmail,
  ThreadMessage,
  GenerationPreferences,
} from "@mail-whale/types";

interface PromptInput {
  styleProfile: StyleProfile;
  exampleEmails: ExampleEmail[];
  threadContext: ThreadMessage[];
  mode: "reply" | "new";
  preferences?: GenerationPreferences;
  newEmailPrompt?: string;
}

interface PromptOutput {
  system: string;
  user: string;
}

export function buildPrompt(input: PromptInput): PromptOutput {
  const { styleProfile, exampleEmails, threadContext, mode, preferences, newEmailPrompt } = input;

  const formalityLabel = styleProfile.formality <= 3 ? "casual" : styleProfile.formality <= 6 ? "neutral" : "formal";
  const directnessLabel = styleProfile.directness >= 7 ? "direct and to-the-point" : styleProfile.directness <= 3 ? "indirect and diplomatic" : "balanced";
  const warmthLabel = styleProfile.warmth >= 7 ? "warm and friendly" : styleProfile.warmth <= 3 ? "professional and reserved" : "moderately warm";

  let toneNote = "";
  if (preferences?.toneAdjust) {
    if (preferences.toneAdjust > 0) toneNote = `\n\nIMPORTANT: Make this reply slightly more formal than usual (adjustment: +${preferences.toneAdjust}).`;
    if (preferences.toneAdjust < 0) toneNote = `\n\nIMPORTANT: Make this reply slightly more casual than usual (adjustment: ${preferences.toneAdjust}).`;
  }

  let lengthNote = "";
  if (preferences?.length) {
    const lengthMap = { brief: "Keep it short — 1-3 sentences max.", standard: "Use your normal email length.", detailed: "Write a thorough, detailed response." };
    lengthNote = `\nLength preference: ${lengthMap[preferences.length]}`;
  }

  const examplesSection = exampleEmails.length > 0
    ? `\n\nHere are examples of how this person writes emails:\n\n${exampleEmails.map((e, i) => `--- Example ${i + 1} (Subject: ${e.subject}) ---\n${e.body}`).join("\n\n")}`
    : "";

  const system = `You are a personal email writing assistant. Your job is to write emails that perfectly match this specific person's writing style. Do NOT write generic-sounding AI emails. Match their voice exactly.

WRITING STYLE PROFILE:
- Tone: ${formalityLabel}, ${directnessLabel}, ${warmthLabel}
- Typical greeting: ${styleProfile.greetings[0] || "none"}
- Typical sign-off: ${styleProfile.signOffs[0] || "none"}
- Average sentence length: ${styleProfile.avgWordsPerSentence} words
- Uses contractions: ${styleProfile.contractionRate > 0.03 ? "yes" : "rarely"}
- Uses emojis: ${styleProfile.emojiRate > 0 ? "occasionally" : "no"}
- Structure: ${styleProfile.structurePreference}
- Frequently used words: ${styleProfile.vocabularyFingerprint.slice(0, 10).join(", ") || "none identified"}
${examplesSection}

RULES:
- Match the greeting and sign-off patterns exactly
- Match the sentence length and paragraph structure
- Use the same level of formality and warmth
- Do NOT add disclaimers, caveats, or AI-sounding phrases
- Output ONLY the email body, no subject line
- Do NOT wrap in quotes or markdown${toneNote}${lengthNote}`;

  let user: string;
  if (mode === "reply") {
    const threadText = threadContext
      .map((m) => `From: ${m.from}\nSubject: ${m.subject}\nDate: ${m.date}\n\n${m.body}`)
      .join("\n\n---\n\n");
    user = `Write a reply to this email thread:\n\n${threadText}`;
  } else {
    user = `Write a new email about: ${newEmailPrompt || "general follow-up"}`;
  }

  return { system, user };
}
