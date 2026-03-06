import { SSEProvider } from "@/components/providers/sse-provider";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SSEProvider>
      <AppShell>{children}</AppShell>
    </SSEProvider>
  );
}
