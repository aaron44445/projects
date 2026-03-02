import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { DottedGrid } from "@/components/dotted-grid";
import { CursorFollower } from "@/components/cursor-follower";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://injectseo.com"
  ),
  title: {
    default: "InjectSEO | Med Spa SEO Agency",
    template: "%s | InjectSEO",
  },
  description:
    "Precision SEO for aesthetic practices. We help med spas dominate Google with data-driven SEO and content marketing.",
  keywords: [
    "med spa SEO",
    "medical spa marketing",
    "aesthetic practice SEO",
    "med spa digital marketing",
  ],
  authors: [{ name: "InjectSEO" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://injectseo.com",
    siteName: "InjectSEO",
    title: "InjectSEO | Med Spa SEO Agency",
    description:
      "Precision SEO for aesthetic practices. We help med spas dominate Google.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InjectSEO | Med Spa SEO Agency",
    description: "Precision SEO for aesthetic practices.",
  },
  robots: { index: true, follow: true },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DottedGrid />
      <CursorFollower />
      <Nav />
      <main className="relative z-10">{children}</main>
      <Footer />
    </>
  );
}
