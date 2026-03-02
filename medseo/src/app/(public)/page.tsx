import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/hero";

const CaseStudies = dynamic(
  () =>
    import("@/components/sections/case-studies").then((m) => ({
      default: m.CaseStudies,
    })),
  { ssr: true }
);

const Process = dynamic(
  () =>
    import("@/components/sections/process").then((m) => ({
      default: m.Process,
    })),
  { ssr: true }
);

const FAQ = dynamic(
  () =>
    import("@/components/sections/faq").then((m) => ({
      default: m.FAQ,
    })),
  { ssr: true }
);

const CTA = dynamic(
  () =>
    import("@/components/sections/cta").then((m) => ({
      default: m.CTA,
    })),
  { ssr: true }
);

export default function Home() {
  return (
    <>
      <Hero />
      <CaseStudies />
      <Process />
      <FAQ />
      <CTA />
    </>
  );
}
