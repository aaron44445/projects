import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-lg font-bold text-white tracking-tight"
        >
          Inject<span className="text-lume">SEO</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-8">
          <Link
            href="/about"
            className="font-mono text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="font-mono text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/book"
            className="font-mono text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Book a Call
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-mono text-xs text-white/25">
          &copy; 2026 InjectSEO
        </p>
      </div>
    </footer>
  );
}
