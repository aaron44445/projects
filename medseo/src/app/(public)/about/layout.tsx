import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet the InjectSEO team. We specialize exclusively in SEO for med spas and aesthetic practices.",
  openGraph: {
    title: "About | InjectSEO",
    description:
      "Meet the InjectSEO team. We specialize exclusively in SEO for med spas and aesthetic practices.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
