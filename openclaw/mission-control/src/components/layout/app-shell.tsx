import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-56">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
