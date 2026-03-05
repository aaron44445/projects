// ============================================================
// Solo Founder Dashboard — localStorage Store
// All state operations go through this module.
// ============================================================

const KEYS = {
  focus: "dashboard-focus",
  habits: "dashboard-habits",
  notes: "dashboard-notes",
  streak: "dashboard-streak",
  goals: "dashboard-goals",
  revenue: "dashboard-revenue",
  reviews: "dashboard-reviews",
  license: "dashboard-license",
  lastVisit: "dashboard-last-visit",
} as const;

// ── Helpers ──────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Focus (3 daily priorities) ──────────────────────────────

export interface FocusItem {
  text: string;
  done: boolean;
}

export interface FocusState {
  date: string;
  items: FocusItem[];
}

const DEFAULT_FOCUS: FocusState = {
  date: "",
  items: [
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ],
};

export function getFocus(): FocusState {
  const state = get<FocusState>(KEYS.focus, DEFAULT_FOCUS);
  // Reset if not today
  if (!isToday(state.date)) {
    const fresh: FocusState = {
      date: todayStr(),
      items: [
        { text: "", done: false },
        { text: "", done: false },
        { text: "", done: false },
      ],
    };
    set(KEYS.focus, fresh);
    return fresh;
  }
  return state;
}

export function setFocus(items: FocusItem[]): void {
  set(KEYS.focus, { date: todayStr(), items });
}

// ── Habits ──────────────────────────────────────────────────

export interface HabitState {
  date: string;
  habits: { name: string; done: boolean }[];
}

const DEFAULT_HABITS: HabitState = {
  date: "",
  habits: [
    { name: "Exercise", done: false },
    { name: "Read", done: false },
    { name: "Code", done: false },
    { name: "Meditate", done: false },
    { name: "Journal", done: false },
  ],
};

export function getHabits(): HabitState {
  const state = get<HabitState>(KEYS.habits, DEFAULT_HABITS);
  if (!isToday(state.date)) {
    // Keep names, reset done
    const fresh: HabitState = {
      date: todayStr(),
      habits: state.habits.map((h) => ({ name: h.name, done: false })),
    };
    // If we somehow have no habits, use defaults
    if (fresh.habits.length === 0) {
      fresh.habits = DEFAULT_HABITS.habits.map((h) => ({ ...h }));
    }
    set(KEYS.habits, fresh);
    return fresh;
  }
  return state;
}

export function toggleHabit(index: number): HabitState {
  const state = getHabits();
  if (index >= 0 && index < state.habits.length) {
    state.habits[index].done = !state.habits[index].done;
    set(KEYS.habits, state);
  }
  return state;
}

export function renameHabit(index: number, name: string): HabitState {
  const state = getHabits();
  if (index >= 0 && index < state.habits.length) {
    state.habits[index].name = name;
    set(KEYS.habits, state);
  }
  return state;
}

// ── Notes ───────────────────────────────────────────────────

export function getNotes(): string {
  return get<string>(KEYS.notes, "");
}

export function setNotes(text: string): void {
  set(KEYS.notes, text);
}

// ── Streak ──────────────────────────────────────────────────

export interface StreakState {
  count: number;
  lastVisit: string;
}

export function getStreak(): StreakState {
  return get<StreakState>(KEYS.streak, { count: 0, lastVisit: "" });
}

export function updateStreak(): StreakState {
  const state = getStreak();
  const today = todayStr();
  const yesterday = yesterdayStr();

  if (state.lastVisit === today) {
    // Already visited today
    return state;
  }

  let newCount: number;
  if (state.lastVisit === yesterday) {
    // Continuing streak
    newCount = state.count + 1;
  } else if (state.lastVisit === "") {
    // First visit ever
    newCount = 1;
  } else {
    // Streak broken
    newCount = 1;
  }

  const updated: StreakState = { count: newCount, lastVisit: today };
  set(KEYS.streak, updated);
  return updated;
}

// ── Goals (paid) ────────────────────────────────────────────

export interface Goal {
  title: string;
  progress: number; // 0-100
}

export function getGoals(): Goal[] {
  return get<Goal[]>(KEYS.goals, []);
}

export function setGoals(goals: Goal[]): void {
  set(KEYS.goals, goals);
}

// ── Revenue (paid) ──────────────────────────────────────────

export interface RevenueEntry {
  month: string; // YYYY-MM
  amount: number;
}

export function getRevenue(): RevenueEntry[] {
  return get<RevenueEntry[]>(KEYS.revenue, []);
}

export function setRevenue(entries: RevenueEntry[]): void {
  set(KEYS.revenue, entries);
}

export function setRevenueForMonth(month: string, amount: number): RevenueEntry[] {
  const entries = getRevenue();
  const idx = entries.findIndex((e) => e.month === month);
  if (idx >= 0) {
    entries[idx].amount = amount;
  } else {
    entries.push({ month, amount });
  }
  // Keep sorted, last 12 months max
  entries.sort((a, b) => a.month.localeCompare(b.month));
  const trimmed = entries.slice(-12);
  set(KEYS.revenue, trimmed);
  return trimmed;
}

// ── Reviews (paid) ──────────────────────────────────────────

export interface Review {
  date: string;
  wins: string;
  challenge: string;
  lesson: string;
  nextPriority: string;
}

export function getReviews(): Review[] {
  return get<Review[]>(KEYS.reviews, []);
}

export function addReview(review: Review): void {
  const reviews = getReviews();
  reviews.push(review);
  set(KEYS.reviews, reviews);
}

// ── License ─────────────────────────────────────────────────

export function getLicense(): string {
  return get<string>(KEYS.license, "");
}

export function setLicense(key: string): void {
  set(KEYS.license, key);
}

export function isPro(): boolean {
  const key = getLicense();
  return key.length >= 8;
}

// ── Export ───────────────────────────────────────────────────

export function exportData(): string {
  const data: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(KEYS)) {
    try {
      const raw = localStorage.getItem(key);
      data[name] = raw ? JSON.parse(raw) : null;
    } catch {
      data[name] = null;
    }
  }
  return JSON.stringify(data, null, 2);
}
