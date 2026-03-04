# Goal-Driven Personalization Design

## Problem
LOCKED IN has disconnected systems — habits, goals, journal, and finances all operate independently. Users can't customize what they track in a meaningful way, and the journal is a passive textarea with no sense of completion. Everything should feel personalized and connected to the user's actual goals.

## Design

### 1. Goals as the Foundation
The Goals view stays but becomes the anchor point for the whole app. Each goal has:
- Name (editable)
- Category (Money / Body / Mind / Spirit or custom)
- Target date (Q1-Q4 / Ongoing)
- Status (Not Started / In Progress / Done)
- **Linked habit completion %** — auto-calculated from tagged habits

### 2. Habits with Optional Goal Tags
Tracker keeps the current edit mode (add/rename/delete/toggle type). Addition: each habit can optionally be linked to a goal.

- Edit mode shows a goal selector per habit (dropdown of user's goals, or "None")
- Normal tracker grid unchanged — clean daily grid
- Goals page shows auto-calculated completion ring per goal based on linked habits' daily completion rate

### 3. Daily Check-In (replaces Journal)
JOURNAL tab becomes CHECK-IN — a guided 3-step daily flow:

- **Step 1: Rate your day** — tap a number 1-10 (row of buttons)
- **Step 2: Reflection** — textarea with rotating prompt tied to growth ("What moved you closer to your goals today?" / "What's one thing you'd do differently?" / etc.)
- **Step 3: Goal pulse** — quick glance at each active goal with one-word status selector (Crushing it / On track / Struggling / Stalled)
- **SAVE CHECK-IN** button locks it in
- Past check-ins show below as dated list with rating + reflection preview
- Day rating feeds into Life Trajectory chart

### 4. Starter Pack with Edit
New users get current 12 default habits. Tracker EDIT button prominent on first visit. No onboarding wizard — just the app with editable defaults.

## What Changes
- Goals page: add completion ring per goal from linked habits
- Tracker edit mode: add goal selector dropdown per habit
- State: habits get optional `goalIndex` field
- Journal tab: rename to CHECK-IN, replace textarea with 3-step flow
- State: check-ins stored as `{ date: { rating, reflection, goalPulse: {} } }`
- Dashboard life trajectory: can incorporate day ratings alongside life score

## What Stays
- All existing tracker grid rendering
- Habit add/rename/delete/toggle type
- Finance itemized system
- Auth/Supabase sync
- All CSS/aesthetic choices
