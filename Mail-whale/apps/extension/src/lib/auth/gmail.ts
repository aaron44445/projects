import type { AuthState } from "./types";

export async function authenticateGmail(): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || "Auth failed"));
        return;
      }

      // Fetch user's email address
      const res = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = await res.json();

      const authState: AuthState = {
        provider: "gmail",
        accessToken: token,
        email: profile.emailAddress,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour
      };

      // Persist to extension storage
      await chrome.storage.local.set({ authState });
      resolve(authState);
    });
  });
}

export async function getGmailToken(): Promise<string | null> {
  const data = await chrome.storage.local.get("authState");
  const state = data.authState as AuthState | undefined;
  if (!state || state.provider !== "gmail") return null;
  if (Date.now() > state.expiresAt) {
    // Token expired, refresh silently
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        resolve(token || null);
      });
    });
  }
  return state.accessToken;
}

export async function signOutGmail(): Promise<void> {
  const data = await chrome.storage.local.get("authState");
  const state = data.authState as AuthState | undefined;
  if (state?.accessToken) {
    chrome.identity.removeCachedAuthToken({ token: state.accessToken });
  }
  await chrome.storage.local.remove("authState");
}
