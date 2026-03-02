"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            Inject<span className="text-lume">SEO</span>
          </h1>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-lume/10 border border-lume/20 mb-4">
              <Lock className="w-5 h-5 text-lume" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-white">
              Dashboard Access
            </h2>
            <p className="text-sm text-white/40 mt-1 font-mono">
              Enter password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-lume focus-visible:ring-lume/20"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 bg-lume text-[#0A0A0B] font-heading font-semibold hover:bg-lume/90 disabled:opacity-40"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </Button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs font-mono mt-6">
          InjectSEO Internal Dashboard
        </p>
      </div>
    </div>
  );
}
