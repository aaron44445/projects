import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aaron McBride — Digital Products",
  description:
    "AI-powered tools, templates & resources for creators and solo founders.",
  openGraph: {
    title: "Aaron McBride — Digital Products",
    description:
      "AI-powered tools, templates & resources for creators and solo founders.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aaron McBride — Digital Products",
    description:
      "AI-powered tools, templates & resources for creators and solo founders.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
