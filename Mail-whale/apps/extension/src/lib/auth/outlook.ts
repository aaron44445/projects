import type { AuthState } from "./types";

const MS_CLIENT_ID = "PLACEHOLDER_MS_CLIENT_ID";
const MS_SCOPES = ["openid", "email", "Mail.Read"];

export async function authenticateOutlook(): Promise<AuthState> {
  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${MS_CLIENT_ID}&` +
    `response_type=token&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(MS_SCOPES.join(" "))}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          reject(
            new Error(
              chrome.runtime.lastError?.message || "Outlook auth failed"
            )
          );
          return;
        }

        const url = new URL(responseUrl);
        const hash = new URLSearchParams(url.hash.slice(1));
        const accessToken = hash.get("access_token");
        if (!accessToken) {
          reject(new Error("No access token in response"));
          return;
        }

        // Get user email from Microsoft Graph
        const res = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await res.json();

        const authState: AuthState = {
          provider: "outlook",
          accessToken,
          email: profile.mail || profile.userPrincipalName,
          expiresAt: Date.now() + 3600 * 1000,
        };

        await chrome.storage.local.set({ authState });
        resolve(authState);
      }
    );
  });
}
