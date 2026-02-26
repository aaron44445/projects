import type { RawEmail, FetchProgress } from "./types";

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

async function gmailFetch(path: string, token: string) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch sent emails from Gmail API.
 * Uses pagination to get up to `maxEmails` sent messages.
 */
export async function fetchSentEmails(
  token: string,
  maxEmails: number = 500,
  onProgress?: (progress: FetchProgress) => void
): Promise<RawEmail[]> {
  const emails: RawEmail[] = [];
  let pageToken: string | undefined;
  let total = 0;

  // First, get total count estimate
  const initial = await gmailFetch(
    `/messages?labelIds=SENT&maxResults=1`,
    token
  );
  total = Math.min(initial.resultSizeEstimate || maxEmails, maxEmails);

  do {
    const pageSize = Math.min(100, maxEmails - emails.length);
    const query = `/messages?labelIds=SENT&maxResults=${pageSize}${
      pageToken ? `&pageToken=${pageToken}` : ""
    }`;
    const page = await gmailFetch(query, token);

    if (!page.messages) break;

    // Fetch full message details in batches of 10
    for (let i = 0; i < page.messages.length; i += 10) {
      const batch = page.messages.slice(i, i + 10);
      const details = await Promise.all(
        batch.map((msg: { id: string }) =>
          gmailFetch(`/messages/${msg.id}?format=full`, token)
        )
      );

      for (const detail of details) {
        const email = parseGmailMessage(detail);
        if (email) emails.push(email);
      }

      onProgress?.({
        fetched: emails.length,
        total,
        status: "scanning",
      });
    }

    pageToken = page.nextPageToken;
  } while (pageToken && emails.length < maxEmails);

  onProgress?.({ fetched: emails.length, total: emails.length, status: "done" });
  return emails;
}

function parseGmailMessage(message: any): RawEmail | null {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
      ?.value || "";

  const subject = getHeader("Subject");
  const from = getHeader("From");
  const to = getHeader("To")
    .split(",")
    .map((t: string) => t.trim());
  const date = getHeader("Date");

  const body = extractBody(message.payload);
  if (!body) return null;

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    to,
    body,
    date,
    snippet: message.snippet || "",
  };
}

function extractBody(payload: any): string {
  if (!payload) return "";

  // Direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart - prefer text/plain
  if (payload.parts) {
    const textPart = payload.parts.find(
      (p: any) => p.mimeType === "text/plain"
    );
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }
    // Fallback to first part with body
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }

  return "";
}

export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}
