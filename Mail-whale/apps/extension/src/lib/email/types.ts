export interface RawEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  date: string;
  snippet: string;
}

export interface FetchProgress {
  fetched: number;
  total: number;
  status: "scanning" | "done" | "error";
}
