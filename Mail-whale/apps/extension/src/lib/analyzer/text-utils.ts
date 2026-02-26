/**
 * Text utility functions for email style analysis.
 */

const GREETING_PATTERNS =
  /^(Hey|Hi|Hello|Dear|Good morning|Good afternoon|Good evening|Howdy|Yo|Hiya|What's up)/i;

const SIGNOFF_PATTERNS =
  /(?:^|\n)(Best|Thanks|Cheers|Regards|Sincerely|Warmly|Take care|Best regards|Kind regards|Many thanks|Thank you|Yours truly|Respectfully|All the best|Talk soon|Later|Peace|Warm regards|With appreciation)[\s,]*$/im;

const CONTRACTION_PATTERN =
  /\b(i'm|i've|i'll|i'd|we're|we've|we'll|we'd|you're|you've|you'll|you'd|they're|they've|they'll|they'd|he's|she's|it's|that's|there's|here's|who's|what's|where's|when's|how's|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shouldn't|couldn't|can't|mustn't|let's|ain't)\b/gi;

const EMOJI_PATTERN =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;

/**
 * Split text into sentences. Handles common abbreviations and edge cases.
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];

  // Split on sentence-ending punctuation followed by whitespace or end of string
  const sentences = text
    .replace(/\n{2,}/g, ". ") // Treat double newlines as sentence breaks
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

/**
 * Split text into paragraphs (separated by blank lines or double newlines).
 */
export function splitParagraphs(text: string): string[] {
  if (!text.trim()) return [];

  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Count words in a text string.
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Extract the greeting from the beginning of an email body.
 * Returns the matched greeting or null.
 */
export function extractGreeting(text: string): string | null {
  const firstLine = text.trim().split("\n")[0]?.trim() || "";
  const match = firstLine.match(GREETING_PATTERNS);
  return match ? match[1] : null;
}

/**
 * Extract the sign-off from the end of an email body.
 * Returns the matched sign-off or null.
 */
export function extractSignOff(text: string): string | null {
  const match = text.match(SIGNOFF_PATTERNS);
  return match ? match[1] : null;
}

/**
 * Calculate the rate of contractions used relative to total words.
 * Returns a value between 0 and 1.
 */
export function contractionRate(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  const matches = text.match(CONTRACTION_PATTERN);
  const count = matches ? matches.length : 0;
  return count / words;
}

/**
 * Calculate the rate of emoji usage relative to total words.
 * Returns a value between 0 and 1.
 */
export function emojiRate(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  const matches = text.match(EMOJI_PATTERN);
  const count = matches ? matches.length : 0;
  return count / words;
}

/**
 * Calculate the ratio of questions to total sentences.
 * Returns a value between 0 and 1.
 */
export function questionRatio(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  const questions = sentences.filter((s) => s.trim().endsWith("?"));
  return questions.length / sentences.length;
}

/**
 * Check if text contains bullet points.
 */
export function hasBullets(text: string): boolean {
  return /(?:^|\n)\s*[-*\u2022]\s+/m.test(text);
}

/**
 * Check if text contains numbered lists.
 */
export function hasNumberedList(text: string): boolean {
  return /(?:^|\n)\s*\d+[.)]\s+/m.test(text);
}
