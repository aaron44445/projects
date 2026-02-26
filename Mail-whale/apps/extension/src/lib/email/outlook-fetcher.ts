import type { RawEmail, FetchProgress } from "./types";

const GRAPH_API = "https://graph.microsoft.com/v1.0/me";

export async function fetchOutlookSentEmails(
  token: string,
  maxEmails: number = 500,
  onProgress?: (progress: FetchProgress) => void
): Promise<RawEmail[]> {
  const emails: RawEmail[] = [];
  let nextLink: string | undefined =
    `${GRAPH_API}/mailFolders/SentItems/messages?$top=50&$select=id,conversationId,subject,from,toRecipients,body,sentDateTime&$orderby=sentDateTime desc`;

  while (nextLink && emails.length < maxEmails) {
    const res = await fetch(nextLink, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    for (const msg of data.value || []) {
      emails.push({
        id: msg.id,
        threadId: msg.conversationId,
        subject: msg.subject || "",
        from: msg.from?.emailAddress?.address || "",
        to: (msg.toRecipients || []).map(
          (r: any) => r.emailAddress?.address || ""
        ),
        body: msg.body?.content || "",
        date: msg.sentDateTime || "",
        snippet: (msg.body?.content || "").slice(0, 200),
      });
    }

    onProgress?.({
      fetched: emails.length,
      total: maxEmails,
      status: "scanning",
    });

    nextLink = data["@odata.nextLink"];
  }

  onProgress?.({ fetched: emails.length, total: emails.length, status: "done" });
  return emails;
}
