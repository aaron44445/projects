import React, { useState } from "react";
import type { FetchProgress } from "../../../lib/email/types";

interface OnboardingViewProps {
  onConnectGmail: () => Promise<void>;
  scanProgress: FetchProgress | null;
  isScanning: boolean;
}

export function OnboardingView({
  onConnectGmail,
  scanProgress,
  isScanning,
}: OnboardingViewProps) {
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      await onConnectGmail();
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="container">
      <div className="logo">Mail Whale</div>
      <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
        Mail Whale learns your writing style from your sent emails, then helps
        you write replies that sound like you.
      </p>

      {!isScanning ? (
        <>
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Gmail"}
          </button>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            disabled
          >
            Connect Outlook (coming soon)
          </button>
        </>
      ) : (
        <>
          <p className="status-text">
            Learning your writing style...{" "}
            {scanProgress
              ? `${scanProgress.fetched} / ${scanProgress.total} emails`
              : ""}
          </p>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: scanProgress
                  ? `${(scanProgress.fetched / scanProgress.total) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </>
      )}

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "#94a3b8",
          lineHeight: 1.4,
        }}
      >
        Your emails are analyzed locally on your device. We never store or read
        your raw email content.
      </p>
    </div>
  );
}
