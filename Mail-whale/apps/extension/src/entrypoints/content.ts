export default defineContentScript({
  matches: ["*://mail.google.com/*", "*://outlook.live.com/*", "*://outlook.office.com/*"],
  main() {
    // Listen for INSERT_DRAFT messages from side panel
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "INSERT_DRAFT") {
        insertDraftIntoCompose(message.draft);
        sendResponse({ ok: true });
      }
      if (message.type === "GET_THREAD") {
        const thread = readCurrentThread();
        sendResponse({ thread });
      }
      return true;
    });
  },
});

function insertDraftIntoCompose(draft: string) {
  // Gmail compose uses contenteditable divs
  const composeBody = document.querySelector<HTMLElement>(
    'div[aria-label="Message Body"][contenteditable="true"]'
  );
  if (composeBody) {
    composeBody.focus();
    document.execCommand("selectAll");
    document.execCommand("insertText", false, draft);
    return;
  }

  // Outlook compose
  const outlookCompose = document.querySelector<HTMLElement>(
    'div[role="textbox"][contenteditable="true"]'
  );
  if (outlookCompose) {
    outlookCompose.focus();
    document.execCommand("selectAll");
    document.execCommand("insertText", false, draft);
  }
}

function readCurrentThread(): Array<{
  from: string;
  body: string;
  date: string;
}> {
  const messages: Array<{ from: string; body: string; date: string }> = [];

  // Gmail: read expanded messages in the current thread
  const gmailMessages = document.querySelectorAll('div[data-message-id]');
  for (const msg of gmailMessages) {
    const fromEl = msg.querySelector<HTMLElement>('span[email]');
    const bodyEl = msg.querySelector<HTMLElement>('div[dir="ltr"], div.a3s');
    const dateEl = msg.querySelector<HTMLElement>('span[title]');

    messages.push({
      from: fromEl?.getAttribute("email") || fromEl?.textContent || "Unknown",
      body: bodyEl?.textContent || "",
      date: dateEl?.getAttribute("title") || "",
    });
  }

  return messages;
}
