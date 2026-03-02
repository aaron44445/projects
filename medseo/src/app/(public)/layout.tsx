import { Nav } from "@/components/nav";
import { DottedGrid } from "@/components/dotted-grid";
import { CursorFollower } from "@/components/cursor-follower";
import { Footer } from "@/components/footer";

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
