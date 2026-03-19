import type { Metadata, Viewport } from "next";
import { Crimson_Pro } from "next/font/google";
import SwRegister from "@/components/sw-register";
import "./globals.css";

const font = Crimson_Pro({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

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
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={font.className}>
      <body className="min-h-dvh">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
