import { Outlet, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Sparkles, Shield, Zap, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { MEDIA_CATEGORIES } from "@/config/mediaConfig";

const features = [
  { icon: Zap, label: "Live classrooms", desc: "Real-time sessions with mentors" },
  { icon: Shield, label: "XP system", desc: "Track progress with achievements" },
  { icon: Users, label: "Mentor network", desc: "Learn from industry engineers" },
] as const;

export function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#050507] text-[var(--text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* ── Left Brand Panel (desktop) ── */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-[#27272A] bg-[#0E0E11] p-10 lg:flex xl:p-12">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.04] mix-blend-luminosity pointer-events-none">
          <SmartImage
            unsplashId={MEDIA_CATEGORIES.marketing.hero[1].unsplashId}
            alt=""
            className="h-full w-full object-cover"
            wrapperClassName="h-full w-full border-0 bg-transparent"
            width={1000}
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E11] via-transparent to-transparent" />
        </div>
        <div className="relative z-10">
          <Logo />
          <div className="mt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400">
              <Sparkles size={12} className="text-indigo-400" />
              <span>Pan-Ethiopian Engineering Platform</span>
            </div>
            <h1 className="mt-5 max-w-md text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
              {isLogin
                ? "Welcome back to your engineering workspace"
                : "Start learning software engineering with verified mentorship"}
            </h1>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
              {isLogin
                ? "Your active tracks, code sandboxes, squad sessions, and regional hub passes are ready."
                : "Join high school students and university engineers mastering practical web, mobile, AI, and cloud architectures."}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3.5 rounded-lg border border-[#27272A] bg-[#141418] p-3.5 transition-colors duration-150 hover:border-zinc-700"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-zinc-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-zinc-500">© {new Date().getFullYear()} EthioTech Platform.</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 lg:px-12 bg-[#050507]">
        {/* Mobile header */}
        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <Logo />
        </div>

        <main id="main-content" className="w-full max-w-md">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
