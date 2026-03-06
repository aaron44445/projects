import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The AI Prompt Vault — Life Transformation Edition",
  description:
    "20 AI prompts that turn ChatGPT into a world-class life strategist. Like a $500 coaching session for the price of a coffee.",
  openGraph: {
    title: "The AI Prompt Vault — Life Transformation Edition",
    description:
      "20 AI prompts that turn ChatGPT into a world-class life strategist.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The AI Prompt Vault",
    description:
      "20 AI prompts that turn ChatGPT into a world-class life strategist.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
