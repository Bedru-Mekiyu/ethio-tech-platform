import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Github, Twitter, Linkedin, Globe, Heart, ShieldCheck, Sparkles, Code2, Users, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FooterProps {
  className?: string;
}

const PISTELS_PILLARS = [
  { label: "P", name: "Problem-solving", icon: ShieldCheck, desc: "Algorithmic thinking & real challenges" },
  { label: "I", name: "Innovation", icon: Sparkles, desc: "Building novel local & global solutions" },
  { label: "S", name: "Science", icon: Cpu, desc: "Data foundations & computational rigor" },
  { label: "T", name: "Technology", icon: Code2, desc: "Modern full-stack & cloud architecture" },
  { label: "E", name: "Engineering", icon: Cpu, desc: "Systems engineering & clean code" },
  { label: "L", name: "Leadership", icon: Users, desc: "Squad collaboration & peer mentorship" },
  { label: "S", name: "Skills", icon: Sparkles, desc: "Industry readiness & verified certificates" },
];

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[#1E293B] bg-[#090D16] text-[var(--text-primary)] transition-colors",
        className
      )}
    >
      {/* ─── PISTELS Framework Mission Ribbon ─── */}
      <div className="border-b border-[#1E293B] bg-[#0F172A]/40 py-8">
        <div className="page-shell">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#0F172A] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                <Sparkles size={12} className="text-primary" />
                <span>The PISTELS Framework</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Empowering the next generation of African builders
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-lg leading-relaxed">
              Our comprehensive curriculum integrates core technical depth, collaborative squads, and industry-grade engineering standards.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
            {PISTELS_PILLARS.map((pillar) => (
              <div
                key={pillar.name}
                className="group relative flex flex-col p-3 rounded-xl border border-[#1E293B] bg-[#0F172A]/50 hover:bg-[#0F172A] hover:border-[#334155] transition-colors duration-150"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {pillar.label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                  {pillar.name}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-tight">
                  {pillar.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Footer Links & Information ─── */}
      <div className="page-shell py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission Statement */}
          <div className="space-y-4 lg:col-span-2">
            <Logo variant="full" subtitle="East Africa Tech Ecosystem" />
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
              EthioTech is a high-performance interactive learning platform for African students, featuring live interactive classrooms, peer squads, expert mentorship, and project-based tracks.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0F172A] text-[var(--text-muted)] hover:border-[#334155] hover:bg-[#1E293B] hover:text-white transition-colors"
                aria-label="GitHub repository"
              >
                <Github size={17} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0F172A] text-[var(--text-muted)] hover:border-[#334155] hover:bg-[#1E293B] hover:text-white transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter size={17} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0F172A] text-[var(--text-muted)] hover:border-[#334155] hover:bg-[#1E293B] hover:text-white transition-colors"
                aria-label="LinkedIn page"
              >
                <Linkedin size={17} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0F172A] text-[var(--text-muted)] hover:border-[#334155] hover:bg-[#1E293B] hover:text-white transition-colors"
                aria-label="Global Community"
              >
                <Globe size={17} />
              </a>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Tracks & Programs
                </Link>
              </li>
              <li>
                <Link
                  to="/mentors"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Find a Mentor
                </Link>
              </li>
              <li>
                <Link
                  to="/hubs"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Tech Hubs
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  XP Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/mentor-recruitment"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Become a Mentor
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ecosystem & Community */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/community"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Community Squads
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Workshops & Events
                </Link>
              </li>
              <li>
                <Link
                  to="/success-stories"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/donate"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Support & Donate
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Company & Trust</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/partners"
                  className="text-[var(--text-secondary)] hover:text-white hover:underline transition-colors"
                >
                  Ecosystem Partners
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#1E293B] pt-8 text-xs text-[var(--text-muted)] md:flex-row">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Platform Systems Operational</span>
            </span>
            <span>·</span>
            <span>© {new Date().getFullYear()} EthioTech Platform</span>
          </div>

          <p className="flex items-center gap-1.5">
            <span>Engineered with</span>
            <Heart size={13} className="text-rose-500 fill-rose-500 inline" />
            <span>for East African youth</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
