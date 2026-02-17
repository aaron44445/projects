interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string; status: string }> {
  const apiKey = process.env.SENDR_API_KEY;
  if (!apiKey) {
    console.warn("[Sendr] No API key configured, skipping email send");
    return { id: "skipped", status: "no_api_key" };
  }

  const response = await fetch("https://api.sendr.com/v1/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from || process.env.SENDR_FROM_EMAIL || "noreply@aircraftspa.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sendr email failed: ${response.status} ${error}`);
  }

  return response.json();
}
