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
    setMessage("Reading plan reset to 1 Nephi 1");
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Settings</h3>
        <button onClick={onClose} className="text-[var(--text-secondary)]">Close</button>
      </div>
      <div className="mb-6">
        <label className="text-sm text-[var(--text-secondary)] block mb-2">Change PIN</label>
        <div className="flex gap-2">
          <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="New 4-digit PIN" className="flex-1 bg-[var(--bg-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)]" />
          <button onClick={changePin} className="px-4 py-3 rounded-xl bg-[var(--accent-blue)] text-white">Save</button>
        </div>
      </div>
      <div>
        <button onClick={resetPlan} className="w-full py-3 rounded-xl bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/30">Reset Reading Plan</button>
      </div>
      {message && <p className="text-sm text-[var(--accent-gold)] mt-3 text-center">{message}</p>}
    </div>
  );
}
