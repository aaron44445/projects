import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Call",
  description:
    "Book a free 30-minute SEO diagnostic for your med spa. Zero obligation, real insights.",
  openGraph: {
    title: "Book a Call | InjectSEO",
    description:
      "Book a free 30-minute SEO diagnostic for your med spa. Zero obligation, real insights.",
  },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
