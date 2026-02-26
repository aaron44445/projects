import type { StyleProfile } from "@mail-whale/types";
import type { RawEmail } from "../email/types";
import {
  splitSentences,
  splitParagraphs,
  countWords,
  extractGreeting,
  extractSignOff,
  contractionRate as calcContractionRate,
  emojiRate as calcEmojiRate,
  questionRatio as calcQuestionRatio,
  hasBullets,
  hasNumberedList,
} from "./text-utils";

/**
 * Analyze a collection of sent emails and produce a StyleProfile.
 */
export function analyzeStyle(emails: RawEmail[]): StyleProfile {
  if (emails.length === 0) return emptyProfile();

  const greetingCounts = new Map<string, number>();
  const signOffCounts = new Map<string, number>();
  const allWordsPerSentence: number[] = [];
  const allSentencesPerParagraph: number[] = [];
  const allParagraphsPerEmail: number[] = [];
  const allContractionRates: number[] = [];
  const allEmojiRates: number[] = [];
  const allQuestionRatios: number[] = [];
  let bulletCount = 0;
  let numberedCount = 0;
  let proseCount = 0;
  const wordFrequency = new Map<string, number>();

  for (const email of emails) {
    const body = email.body;

    // Greetings
    const greeting = extractGreeting(body);
    if (greeting) {
      const normalized = greeting.charAt(0).toUpperCase() + greeting.slice(1).toLowerCase();
      greetingCounts.set(normalized, (greetingCounts.get(normalized) || 0) + 1);
    }

    // Sign-offs
    const signOff = extractSignOff(body);
    if (signOff) {
      signOffCounts.set(signOff, (signOffCounts.get(signOff) || 0) + 1);
    }

    // Sentence metrics
    const sentences = splitSentences(body);
    for (const sentence of sentences) {
      const wc = countWords(sentence);
      if (wc > 0) allWordsPerSentence.push(wc);
    }

    // Paragraph metrics
    const paragraphs = splitParagraphs(body);
    allParagraphsPerEmail.push(paragraphs.length);
    for (const para of paragraphs) {
      const paraSentences = splitSentences(para);
      if (paraSentences.length > 0) {
        allSentencesPerParagraph.push(paraSentences.length);
      }
    }

    // Rates
    allContractionRates.push(calcContractionRate(body));
    allEmojiRates.push(calcEmojiRate(body));
    allQuestionRatios.push(calcQuestionRatio(body));

    // Structure
    const hasBullet = hasBullets(body);
    const hasNumbers = hasNumberedList(body);
    if (hasBullet) bulletCount++;
    if (hasNumbers) numberedCount++;
    if (!hasBullet && !hasNumbers) proseCount++;

    // Word frequency for vocabulary fingerprint
    const words = body
      .toLowerCase()
      .replace(/[^a-z'\s-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    for (const word of words) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    }
  }

  const avgWordsPerSentence = average(allWordsPerSentence);
  const avgContractionRate = average(allContractionRates);
  const avgEmojiRate = average(allEmojiRates);
  const avgQuestionRatio = average(allQuestionRatios);

  return {
    greetings: sortByFrequency(greetingCounts),
    signOffs: sortByFrequency(signOffCounts),
    avgWordsPerSentence: round(avgWordsPerSentence, 1),
    avgSentencesPerParagraph: round(average(allSentencesPerParagraph), 1),
    avgParagraphsPerEmail: round(average(allParagraphsPerEmail), 1),
    emojiRate: round(avgEmojiRate, 3),
    contractionRate: round(avgContractionRate, 3),
    questionRatio: round(avgQuestionRatio, 3),
    formality: deriveFormality(avgContractionRate, avgEmojiRate, greetingCounts),
    directness: deriveDirectness(avgWordsPerSentence, avgQuestionRatio),
    warmth: deriveWarmth(avgEmojiRate, greetingCounts, signOffCounts),
    structurePreference: deriveStructure(proseCount, bulletCount, numberedCount),
    vocabularyFingerprint: getVocabularyFingerprint(wordFrequency, emails.length),
    emailsAnalyzed: emails.length,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns an empty profile with zero values.
 */
export function emptyProfile(): StyleProfile {
  return {
    greetings: [],
    signOffs: [],
    avgWordsPerSentence: 0,
    avgSentencesPerParagraph: 0,
    avgParagraphsPerEmail: 0,
    emojiRate: 0,
    contractionRate: 0,
    questionRatio: 0,
    formality: 5,
    directness: 5,
    warmth: 5,
    structurePreference: "prose",
    vocabularyFingerprint: [],
    emailsAnalyzed: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Sort map entries by frequency (descending) and return the keys.
 */
export function sortByFrequency(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

/**
 * Derive formality on a 1-10 scale.
 * High contractions + emojis + casual greetings = low formality.
 */
export function deriveFormality(
  contractionRate: number,
  emojiRate: number,
  greetingCounts: Map<string, number>
): number {
  let score = 5; // Start neutral

  // Contractions reduce formality (max -3 points)
  score -= contractionRate * 30;

  // Emojis reduce formality (max -2 points)
  score -= emojiRate * 20;

  // Casual greetings reduce formality
  const casualGreetings = ["Hey", "Yo", "Hiya", "Howdy", "What's up"];
  const formalGreetings = ["Dear", "Good morning", "Good afternoon", "Good evening"];
  const totalGreetings = [...greetingCounts.values()].reduce((a, b) => a + b, 0);

  if (totalGreetings > 0) {
    let casualCount = 0;
    let formalCount = 0;
    for (const [greeting, count] of greetingCounts) {
      if (casualGreetings.some((g) => greeting.toLowerCase() === g.toLowerCase())) {
        casualCount += count;
      }
      if (formalGreetings.some((g) => greeting.toLowerCase() === g.toLowerCase())) {
        formalCount += count;
      }
    }
    score += (formalCount - casualCount) / totalGreetings * 2;
  }

  return clamp(Math.round(score), 1, 10);
}

/**
 * Derive directness on a 1-10 scale.
 * Short sentences + fewer questions = more direct.
 */
export function deriveDirectness(
  avgWordsPerSentence: number,
  questionRatio: number
): number {
  let score = 5;

  // Short sentences -> more direct
  if (avgWordsPerSentence < 10) score += 2;
  else if (avgWordsPerSentence < 15) score += 1;
  else if (avgWordsPerSentence > 20) score -= 1;
  else if (avgWordsPerSentence > 25) score -= 2;

  // Many questions -> less direct
  score -= questionRatio * 4;

  return clamp(Math.round(score), 1, 10);
}

/**
 * Derive warmth on a 1-10 scale.
 * Emojis + warm greetings/sign-offs = more warm.
 */
export function deriveWarmth(
  emojiRate: number,
  greetingCounts: Map<string, number>,
  signOffCounts: Map<string, number>
): number {
  let score = 5;

  // Emojis increase warmth
  score += emojiRate * 20;

  // Warm greetings increase warmth
  const warmGreetings = ["Hey", "Hi", "Hiya", "Howdy"];
  const totalGreetings = [...greetingCounts.values()].reduce((a, b) => a + b, 0);
  if (totalGreetings > 0) {
    let warmCount = 0;
    for (const [greeting, count] of greetingCounts) {
      if (warmGreetings.some((g) => greeting.toLowerCase() === g.toLowerCase())) {
        warmCount += count;
      }
    }
    score += (warmCount / totalGreetings) * 2;
  }

  // Warm sign-offs increase warmth
  const warmSignOffs = ["Cheers", "Warmly", "Take care", "Warm regards", "All the best"];
  const totalSignOffs = [...signOffCounts.values()].reduce((a, b) => a + b, 0);
  if (totalSignOffs > 0) {
    let warmCount = 0;
    for (const [signOff, count] of signOffCounts) {
      if (warmSignOffs.some((s) => signOff.toLowerCase() === s.toLowerCase())) {
        warmCount += count;
      }
    }
    score += (warmCount / totalSignOffs) * 2;
  }

  return clamp(Math.round(score), 1, 10);
}

/**
 * Derive structure preference based on usage counts.
 */
export function deriveStructure(
  proseCount: number,
  bulletCount: number,
  numberedCount: number
): StyleProfile["structurePreference"] {
  const total = proseCount + bulletCount + numberedCount;
  if (total === 0) return "prose";

  const listCount = bulletCount + numberedCount;

  // If lists are used in more than 60% of emails -> bullets or numbered
  if (listCount / total > 0.6) {
    if (numberedCount > bulletCount) return "numbered";
    return "bullets";
  }

  // If lists are used in 20-60% -> mixed
  if (listCount / total > 0.2) return "mixed";

  return "prose";
}

/**
 * Extract vocabulary fingerprint - words that appear frequently
 * and are somewhat unique to this user's writing.
 */
export function getVocabularyFingerprint(
  wordFrequency: Map<string, number>,
  emailCount: number
): string[] {
  // Filter out very common English words
  const stopWords = new Set([
    "that", "this", "with", "have", "from", "will", "been",
    "they", "them", "their", "there", "then", "than", "what",
    "when", "where", "which", "while", "would", "could", "should",
    "about", "after", "before", "between", "other", "some", "such",
    "into", "over", "just", "also", "your", "more", "very",
    "here", "each", "does", "like", "make", "made", "know",
    "well", "back", "only", "come", "good", "give", "most",
    "want", "need", "much", "take", "work", "still", "even",
  ]);

  // Words that appear in at least 10% of emails and are not stop words
  const threshold = Math.max(1, emailCount * 0.1);

  return [...wordFrequency.entries()]
    .filter(([word, count]) => count >= threshold && !stopWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Round a number to specified decimal places.
 */
export function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate average of an array of numbers.
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
