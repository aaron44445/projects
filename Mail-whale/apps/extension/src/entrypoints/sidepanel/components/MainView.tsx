import React, { useState } from "react";
import type { StyleProfile, GenerationPreferences } from "@mail-whale/types";

interface MainViewProps {
  profile: StyleProfile | null;
  onDraftReply: (prefs: GenerationPreferences) => void;
  onDraftNew: (prompt: string, prefs: GenerationPreferences) => void;
  onSettings: () => void;
  loading: boolean;
}

export function MainView({
  profile,
  onDraftReply,
  onDraftNew,
  onSettings,
  loading,
}: MainViewProps) {
  const [toneAdjust, setToneAdjust] = useState(0);
  const [length, setLength] = useState<"brief" | "standard" | "detailed">(
    "standard"
  );
  const [newPrompt, setNewPrompt] = useState("");
  const [mode, setMode] = useState<"reply" | "new">("reply");

  const prefs: GenerationPreferences = { toneAdjust, length };

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="logo">Mail Whale</div>
        <button
          onClick={onSettings}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          Settings
        </button>
      </div>

      {/* Mode toggle */}
      <div className="length-toggle" style={{ marginBottom: 12 }}>
        <button
          className={mode === "reply" ? "active" : ""}
          onClick={() => setMode("reply")}
        >
          Reply
        </button>
        <button
          className={mode === "new" ? "active" : ""}
          onClick={() => setMode("new")}
        >
          New Email
        </button>
      </div>

      {mode === "new" && (
        <textarea
          className="draft-area"
          placeholder="What should the email be about? e.g. 'follow up on the meeting'"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          style={{ minHeight: 80, marginBottom: 12 }}
        />
      )}

      <div className="controls">
        {/* Tone slider */}
        <div className="slider-group">
          <label>
            Tone:{" "}
            {toneAdjust < 0
              ? "More casual"
              : toneAdjust > 0
                ? "More formal"
                : "Your default"}
          </label>
          <input
            type="range"
            min={-3}
            max={3}
            value={toneAdjust}
            onChange={(e) => setToneAdjust(Number(e.target.value))}
          />
        </div>

        {/* Length toggle */}
        <div className="slider-group">
          <label>Length</label>
          <div className="length-toggle">
            {(["brief", "standard", "detailed"] as const).map((l) => (
              <button
                key={l}
                className={length === l ? "active" : ""}
                onClick={() => setLength(l)}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() =>
          mode === "reply"
            ? onDraftReply(prefs)
            : onDraftNew(newPrompt, prefs)
        }
        disabled={loading || (mode === "new" && !newPrompt.trim())}
      >
        {loading
          ? "Generating..."
          : mode === "reply"
            ? "Draft Reply"
            : "Draft Email"}
      </button>

      {profile && (
        <div className="profile-summary">
          <h3>Your Writing Style</h3>
          <div className="trait">
            <span className="trait-label">Tone</span>
            <span className="trait-value">
              {profile.formality <= 3
                ? "Casual"
                : profile.formality <= 6
                  ? "Neutral"
                  : "Formal"}
            </span>
          </div>
          <div className="trait">
            <span className="trait-label">Greeting</span>
            <span className="trait-value">
              {profile.greetings[0] || "None"}
            </span>
          </div>
          <div className="trait">
            <span className="trait-label">Sign-off</span>
            <span className="trait-value">
              {profile.signOffs[0] || "None"}
            </span>
          </div>
          <div className="trait">
            <span className="trait-label">Emails analyzed</span>
            <span className="trait-value">{profile.emailsAnalyzed}</span>
          </div>
        </div>
      )}
    </div>
  );
}
