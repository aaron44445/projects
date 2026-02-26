import { authenticateGmail, signOutGmail } from "../lib/auth/gmail";
import { authenticateOutlook } from "../lib/auth/outlook";

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GMAIL_AUTH") {
      authenticateGmail().then(sendResponse).catch((err) =>
        sendResponse({ error: err.message })
      );
      return true; // async response
    }
    if (message.type === "OUTLOOK_AUTH") {
      authenticateOutlook().then(sendResponse).catch((err) =>
        sendResponse({ error: err.message })
      );
      return true;
    }
    if (message.type === "SIGN_OUT") {
      signOutGmail().then(() => sendResponse({ ok: true }));
      return true;
    }
  });

  console.log("Mail Whale background service worker started");
});
