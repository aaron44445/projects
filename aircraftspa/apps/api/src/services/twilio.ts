import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, body: string): Promise<{ sid: string; status: string }> {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.warn("[Twilio] No account SID configured, skipping SMS send");
    return { sid: "skipped", status: "no_credentials" };
  }

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  return { sid: message.sid, status: message.status };
}
