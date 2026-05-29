import { Outlet, Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft, Sparkles, Shield, Zap, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { MEDIA_CATEGORIES } from "@/config/mediaConfig";

const features = [
  { icon: Zap, label: "Live immersive classrooms", desc: "Real-time sessions with mentors" },
  { icon: Shield, label: "Gamified XP system", desc: "Track progress with achievements" },
  { icon: Users, label: "Global mentor network", desc: "Learn from industry engineers" },
] as const;

export function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--bg-base)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to main content
      </a>

      {/* ── Ambient Background ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[30%] -top-[20%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(0,210,255,0.1),transparent_60%)] blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[20%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(123,97,255,0.08),transparent_60%)] blur-3xl" />
      </div>

      {/* ── Left Brand Panel (desktop) ── */}
      <div className="relative hidden w-[48%] flex-col justify-between p-10 lg:flex xl:p-14 overflow-hidden border-r border-white/5 bg-[var(--bg-card)]/10">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.06] mix-blend-luminosity pointer-events-none">
          <SmartImage
            unsplashId={MEDIA_CATEGORIES.marketing.hero[1].unsplashId}
            alt=""
            className="h-full w-full object-cover"
            width={1000}
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent" />
        </div>

        <div className="relative z-10">
          <Logo />
          <div className="mt-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-muted)] bg-[var(--primary-subtle)] px-3 py-1">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-semibold tracking-wide text-primary">
                Ethiopia&apos;s premier tech academy
              </span>
            </div>
            <h1 className="mt-6 max-w-md text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
              {isLogin
                ? "Welcome back to your learning journey"
                : "Begin your path to world-class engineering"}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">
              {isLogin
                ? "Your dashboard, mentors, and live sessions are waiting. Pick up right where you left off."
                : "Join thousands of Ethiopian students and mentors building the future through immersive, gamified tech education."}
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4 backdrop-blur-sm transition-colors duration-200 hover:border-[var(--border-strong)] hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary-muted)] text-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} EthioTech. Empowering African innovators.
        </p>

        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ── Right Form Panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 lg:px-12">
        {/* Mobile header */}
        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <Logo />
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-white"
          >
            <ArrowLeft size={14} />
            Home
          </Link>
        </div>

        <main id="main-content" className="w-full max-w-md">
          <Outlet />
        </main>

        {/* Desktop back link */}
        <div className="mt-8 hidden lg:block">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
