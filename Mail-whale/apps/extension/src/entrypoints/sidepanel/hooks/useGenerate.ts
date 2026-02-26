import { useState } from "react";
import type { GenerateRequest, GenerateResponse } from "@mail-whale/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useGenerate(apiToken: string | null) {
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(request: GenerateRequest) {
    if (!apiToken) {
      setError("Not authenticated");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data: GenerateResponse = await res.json();
      setDraft(data.draft);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { draft, setDraft, loading, error, generate };
}
