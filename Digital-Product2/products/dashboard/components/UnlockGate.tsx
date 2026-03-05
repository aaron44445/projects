"use client";

import { useState } from "react";

interface UnlockGateProps {
  onUnlock: (key: string) => void;
}

export default function UnlockGate({ onUnlock }: UnlockGateProps) {
  const [showInput, setShowInput] = useState(false);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (key.trim().length < 8) {
      setError("License key must be at least 8 characters.");
      return;
    }
    setError("");
    onUnlock(key.trim());
  }

  return (
    <div className="card border-dashed border-neutral-700 text-center">
      <div className="mb-2">
        <svg
          className="mx-auto h-8 w-8 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-neutral-300 mb-1">
        Pro Features Locked
      </h3>
      <p className="text-xs text-neutral-500 mb-4">
        Unlock goals, revenue tracking, weekly reviews, and data export.
      </p>

      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="btn-primary text-sm"
        >
          Unlock with License Key
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your Gumroad license key"
            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-center">
            <button type="submit" className="btn-primary text-sm">
              Activate
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setKey("");
                setError("");
              }}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
