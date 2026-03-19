"use client";

import { useState } from "react";

interface SettingsPanelProps { onClose: () => void; }

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");

  async function changePin() {
    if (!/^\d{4}$/.test(newPin)) { setMessage("PIN must be 4 digits"); return; }
    const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_pin", pin: newPin }) });
    if (res.ok) { setMessage("PIN changed"); setNewPin(""); }
  }

  async function resetPlan() {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset_plan" }) });
    setMessage("Plan reset to 1 Nephi 1");
  }

  return (
    <div>
      <button onClick={onClose} className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-8">
        Back
      </button>
      <div className="py-6 border-b border-white/5">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-4">Change PIN</p>
        <div className="flex gap-4">
          <input
            type="password"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            placeholder="0000"
            className="flex-1 bg-transparent border-b border-white/10 focus:border-[var(--accent)] pb-2 text-[var(--fg)] outline-none text-lg tracking-[0.5em] text-center transition-colors"
          />
          <button onClick={changePin} className="text-sm tracking-[0.15em] uppercase text-[var(--accent)]">
            Save
          </button>
        </div>
      </div>
      <div className="py-6">
        <button onClick={resetPlan} className="text-sm tracking-[0.15em] uppercase text-[var(--slip)]">
          Reset reading plan
        </button>
      </div>
      {message && <p className="text-sm text-[var(--accent)] mt-2">{message}</p>}
    </div>
  );
}
