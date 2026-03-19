export interface UserConfig {
  id: string;
  pin_hash: string;
  current_book: string;
  current_chapter: number;
  study_streak: number;
  longest_study_streak: number;
  cycles_completed: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingLog {
  id: string;
  date: string;
  book: string;
  chapter: number;
  completed: boolean;
  is_ai_adjusted: boolean;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  type: "reflection" | "trigger" | "checkin_morning" | "checkin_evening";
  reading_log_id: string | null;
  content: string;
  ai_prompt: string | null;
  mood: number | null;
  clean_today: boolean | null;
  ai_response: string | null;
  created_at: string;
}

export interface CleanStreak {
  id: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
}

export interface AiAdjustment {
  id: string;
  detected_theme: string;
  reasoning: string;
  scriptures: { book: string; chapter: number }[];
  original_position: { book: string; chapter: number };
  created_at: string;
}

export interface EmergencyLog {
  id: string;
  scripture_ref: string;
  shown_at: string;
}

export interface ScriptureBook {
  id: string;
  name: string;
  chapters: number;
  volume: "book-of-mormon" | "old-testament" | "new-testament" | "doctrine-and-covenants" | "pearl-of-great-price";
}

export interface EmergencyScripture {
  ref: string;
  text: string;
  theme: "strength" | "temptation" | "love" | "hope" | "atonement" | "self-mastery";
}
