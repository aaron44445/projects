import { useState, useEffect } from "react";
import type { AuthState } from "../../../lib/auth/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(["authState", "apiToken"], (data) => {
      if (data.authState) setAuthState(data.authState);
      if (data.apiToken) setApiToken(data.apiToken);
      setLoading(false);
    });
  }, []);

  async function connectGmail() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GMAIL_AUTH",
      });
      if (response.error) throw new Error(response.error);

      setAuthState(response);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: response.email,
          provider: "gmail",
        }),
      });
      const { token } = await res.json();
      setApiToken(token);
      await chrome.storage.local.set({ apiToken: token });
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
    await chrome.storage.local.remove(["authState", "apiToken"]);
    setAuthState(null);
    setApiToken(null);
  }

  return { authState, apiToken, loading, connectGmail, signOut };
}
