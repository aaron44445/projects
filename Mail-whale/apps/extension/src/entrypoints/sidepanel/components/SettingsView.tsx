import React from "react";
import type { StyleProfile } from "@mail-whale/types";

interface SettingsViewProps {
  profile: StyleProfile | null;
  email: string;
  onRescan: () => void;
  onSignOut: () => void;
  onBack: () => void;
  isScanning: boolean;
}

export function SettingsView({
  profile,
  email,
  onRescan,
  onSignOut,
  onBack,
  isScanning,
}: SettingsViewProps) {
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div className="logo">Settings</div>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          Back
        </button>
      </div>

      <div className="profile-summary">
        <h3>Account</h3>
        <div className="trait">
          <span className="trait-label">Email</span>
          <span className="trait-value">{email}</span>
        </div>
        <div className="trait">
          <span className="trait-label">Emails analyzed</span>
          <span className="trait-value">
            {profile?.emailsAnalyzed || 0}
          </span>
        </div>
        <div className="trait">
          <span className="trait-label">Last updated</span>
          <span className="trait-value">
            {profile?.lastUpdated
              ? new Date(profile.lastUpdated).toLocaleDateString()
              : "Never"}
          </span>
        </div>
      </div>

      <div className="controls">
        <button
          className="btn btn-secondary"
          onClick={onRescan}
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Re-scan Emails"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onSignOut}
          style={{ color: "#dc2626" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
