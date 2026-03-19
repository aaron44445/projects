import type { Metadata, Viewport } from "next";
import SwRegister from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scripture Study",
  description: "Personal scripture study & accountability",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[var(--bg-primary)]">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
