"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import FocusCard from "@/components/FocusCard";
import HabitCard from "@/components/HabitCard";
import NotesCard from "@/components/NotesCard";
import GoalCard from "@/components/GoalCard";
import RevenueCard from "@/components/RevenueCard";
import ReviewCard from "@/components/ReviewCard";
import UnlockGate from "@/components/UnlockGate";
import ExportButton from "@/components/ExportButton";
import {
  getFocus,
  setFocus,
  getHabits,
  toggleHabit,
  renameHabit,
  getNotes,
  setNotes,
  updateStreak,
  getGoals,
  setGoals,
  getRevenue,
  setRevenueForMonth,
  getReviews,
  addReview,
  isPro,
  setLicense,
} from "@/lib/store";
import type { FocusItem, Goal, Review, RevenueEntry } from "@/lib/store";

export default function Dashboard() {
  // ── State ───────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [habits, setHabitsState] = useState<{ name: string; done: boolean }[]>(
    []
  );
  const [notes, setNotesState] = useState("");
  const [streak, setStreak] = useState(0);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [revenue, setRevenueState] = useState<RevenueEntry[]>([]);
  const [reviews, setReviewsState] = useState<Review[]>([]);
  const [pro, setPro] = useState(false);

  // ── Initialize from localStorage ────────────────────────
  useEffect(() => {
    const focusState = getFocus();
    setFocusItems(focusState.items);

    const habitState = getHabits();
    setHabitsState(habitState.habits);

    setNotesState(getNotes());

    const streakState = updateStreak();
    setStreak(streakState.count);

    setGoalsState(getGoals());
    setRevenueState(getRevenue());
    setReviewsState(getReviews());
    setPro(isPro());

    setMounted(true);
  }, []);

  // ── Handlers ────────────────────────────────────────────
  const handleFocusChange = useCallback((items: FocusItem[]) => {
    setFocusItems(items);
    setFocus(items);
  }, []);

  const handleHabitToggle = useCallback((index: number) => {
    const updated = toggleHabit(index);
    setHabitsState([...updated.habits]);
  }, []);

  const handleHabitRename = useCallback((index: number, name: string) => {
    const updated = renameHabit(index, name);
    setHabitsState([...updated.habits]);
  }, []);

  const handleNotesChange = useCallback((text: string) => {
    setNotesState(text);
    setNotes(text);
  }, []);

  const handleGoalsChange = useCallback((g: Goal[]) => {
    setGoalsState(g);
    setGoals(g);
  }, []);

  const handleRevenue = useCallback((month: string, amount: number) => {
    const updated = setRevenueForMonth(month, amount);
    setRevenueState([...updated]);
  }, []);

  const handleAddReview = useCallback((review: Review) => {
    addReview(review);
    setReviewsState(getReviews());
  }, []);

  const handleUnlock = useCallback((key: string) => {
    setLicense(key);
    setPro(true);
  }, []);

  // ── SSR guard ──────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <Header streak={streak} isPro={pro} />

      {/* Free tier */}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <FocusCard items={focusItems} onChange={handleFocusChange} />
        <HabitCard
          habits={habits}
          onToggle={handleHabitToggle}
          onRename={handleHabitRename}
        />
      </div>

      <div className="mb-8">
        <NotesCard notes={notes} onChange={handleNotesChange} />
      </div>

      {/* Paid tier */}
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Pro Features
          </span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        {pro ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <GoalCard goals={goals} onChange={handleGoalsChange} />
              <RevenueCard entries={revenue} onSetRevenue={handleRevenue} />
            </div>
            <div className="mb-4">
              <ReviewCard reviews={reviews} onAddReview={handleAddReview} />
            </div>
            <ExportButton />
          </>
        ) : (
          <UnlockGate onUnlock={handleUnlock} />
        )}
      </div>
    </main>
  );
}
