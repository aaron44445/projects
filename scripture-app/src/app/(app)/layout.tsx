import TabBar from "@/components/tab-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-6 pt-12 pb-24">{children}</main>
      <TabBar />
    </div>
  );
}
