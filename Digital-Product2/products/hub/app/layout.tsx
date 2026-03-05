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
  title: "Aaron McBride — AI-Powered Digital Products",
  description:
    "Tools, templates & systems built by a solo founder using AI. For creators who ship.",
  openGraph: {
    title: "Aaron McBride — AI-Powered Digital Products",
    description:
      "Tools, templates & systems built by a solo founder using AI. For creators who ship.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aaron McBride — AI-Powered Digital Products",
    description:
      "Tools, templates & systems built by a solo founder using AI. For creators who ship.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
