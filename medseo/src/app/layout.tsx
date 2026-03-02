import type { Metadata } from "next";
import { spaceGrotesk, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "InjectSEO | Med Spa SEO Agency",
  description:
    "Precision SEO for aesthetic practices. We help med spas dominate Google with data-driven SEO and content marketing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-heading antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
