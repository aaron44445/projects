import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useGenerate } from "./hooks/useGenerate";
import { OnboardingView } from "./components/OnboardingView";
import { MainView } from "./components/MainView";
import { DraftView } from "./components/DraftView";
import { SettingsView } from "./components/SettingsView";
import { fetchSentEmails } from "../../lib/email/gmail-fetcher";
import { analyzeStyle } from "../../lib/analyzer/style-analyzer";
import type { StyleProfile, GenerationPreferences } from "@mail-whale/types";
import type { FetchProgress, RawEmail } from "../../lib/email/types";
import "./styles.css";

type View = "onboarding" | "main" | "draft" | "settings";

export default function App() {
  const { authState, apiToken, loading: authLoading, connectGmail, signOut } = useAuth();
  const { draft, setDraft, loading: genLoading, error, generate } = useGenerate(apiToken);

  const [view, setView] = useState<View>("onboarding");
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [scanProgress, setScanProgress] = useState<FetchProgress | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [emails, setEmails] = useState<RawEmail[]>([]);

  // Load cached profile on mount
  useEffect(() => {
    chrome.storage.local.get("styleProfile", (data) => {
      if (data.styleProfile) {
        setProfile(data.styleProfile);
      }
    });
  }, []);

  // Switch to main view when authenticated and profile exists
  useEffect(() => {
    if (authState && profile) {
      setView("main");
    } else if (!authState && !authLoading) {
      setView("onboarding");
    }
  }, [authState, profile, authLoading]);

  // When draft is generated, switch to draft view
  useEffect(() => {
    if (draft) setView("draft");
  }, [draft]);

  const runScan = useCallback(async () => {
    if (!authState) return;
    setIsScanning(true);
    try {
      const fetched = await fetchSentEmails(
        authState.accessToken,
        500,
        setScanProgress
      );
      setEmails(fetched);
      const newProfile = analyzeStyle(fetched);
      setProfile(newProfile);
      await chrome.storage.local.set({ styleProfile: newProfile });

      // Sync profile to backend
      if (apiToken) {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        await fetch(`${API_URL}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify(newProfile),
        });
      }
    } finally {
      setIsScanning(false);
    }
  }, [authState, apiToken]);

  async function handleConnectGmail() {
    await connectGmail();
    setTimeout(runScan, 500);
  }

  function handleDraftReply(prefs: GenerationPreferences) {
    if (!profile) return;
    generate({
      styleProfile: profile,
      exampleEmails: emails.slice(0, 5).map((e) => ({
        subject: e.subject,
        body: e.body,
        date: e.date,
      })),
      threadContext: [],
      mode: "reply",
      preferences: prefs,
    });
  }

  function handleDraftNew(prompt: string, prefs: GenerationPreferences) {
    if (!profile) return;
    generate({
      styleProfile: profile,
      exampleEmails: emails.slice(0, 5).map((e) => ({
        subject: e.subject,
        body: e.body,
        date: e.date,
      })),
      threadContext: [],
      mode: "new",
      newEmailPrompt: prompt,
      preferences: prefs,
    });
  }

  function handleInsert() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "INSERT_DRAFT",
          draft,
        });
      }
    });
  }

  if (authLoading) {
    return (
      <div className="container">
        <div className="logo">Mail Whale</div>
        <p className="status-text">Loading...</p>
      </div>
    );
  }

  switch (view) {
    case "onboarding":
      return (
        <OnboardingView
          onConnectGmail={handleConnectGmail}
          scanProgress={scanProgress}
          isScanning={isScanning}
        />
      );
    case "main":
      return (
        <MainView
          profile={profile}
          onDraftReply={handleDraftReply}
          onDraftNew={handleDraftNew}
          onSettings={() => setView("settings")}
          loading={genLoading}
        />
      );
    case "draft":
      return (
        <DraftView
          draft={draft}
          onEdit={setDraft}
          onInsert={handleInsert}
          onRegenerate={() => {
            /* re-run last generate call */
          }}
          onBack={() => setView("main")}
          loading={genLoading}
        />
      );
    case "settings":
      return (
        <SettingsView
          profile={profile}
          email={authState?.email || ""}
          onRescan={runScan}
          onSignOut={async () => {
            await signOut();
            setProfile(null);
            setView("onboarding");
          }}
          onBack={() => setView("main")}
          isScanning={isScanning}
        />
      );
  }
}
