import Stripe from "stripe";
import Link from "next/link";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <InvalidPage message="No session ID provided." />;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return <InvalidPage message="Payment not completed." />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            You&apos;re in.
          </h1>
          <p className="text-foreground-dim mb-8 leading-relaxed">
            Thanks for grabbing the Vault. Open the PDF, pick the prompt that
            matches what you&apos;re dealing with, and paste it into ChatGPT or
            Claude. Be honest when it asks you questions.
          </p>
          <a
            href="/ai-prompt-vault.pdf"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-display text-lg font-bold text-background transition-transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download the Vault
          </a>
          <p className="mt-6 text-sm text-foreground-dim/50">
            Bookmark this page — you can come back to download again.
          </p>
        </div>
      </div>
    );
  } catch {
    return <InvalidPage message="Could not verify payment." />;
  }
}

function InvalidPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">
          Something went wrong
        </h1>
        <p className="text-foreground-dim mb-8">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-6 py-3 font-display font-bold text-foreground transition-colors hover:bg-surface"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
