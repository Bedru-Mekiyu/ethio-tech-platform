import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Github, Twitter, Linkedin, Globe, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn("border-t border-zinc-200 bg-zinc-50/70 text-[var(--text-primary)] transition-colors", className)}
    >
      {/* ─── Main Footer Links & Information ─── */}
      <div className="page-shell py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission Statement */}
          <div className="space-y-4 lg:col-span-2">
            <Logo variant="full" subtitle="East Africa Tech Ecosystem" />
            <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
              EthioTech is a high-performance interactive learning platform for African students, featuring live
              interactive classrooms, peer squads, expert mentorship, and project-based tracks.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="GitHub repository"
              >
                <Github size={15} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter size={15} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="LinkedIn page"
              >
                <Linkedin size={15} />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Global Community"
              >
                <Globe size={15} />
              </a>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3.5">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tracks" className="text-zinc-600 hover:text-primary transition-colors">
                  Curriculum Tracks
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-zinc-600 hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/mentors" className="text-zinc-600 hover:text-primary transition-colors">
                  Engineering Mentors
                </Link>
              </li>
              <li>
                <Link to="/hubs" className="text-zinc-600 hover:text-primary transition-colors">
                  Regional Tech Hubs
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-zinc-600 hover:text-primary transition-colors">
                  XP Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/mentor-recruitment" className="text-zinc-600 hover:text-primary transition-colors">
                  Become a Mentor
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ecosystem & Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3.5">Ecosystem</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/partners" className="text-zinc-600 hover:text-primary transition-colors">
                  Industry & University Partners
                </Link>
              </li>
              <li>
                <Link to="/donate" className="text-zinc-600 hover:text-primary transition-colors">
                  Scholarships & Giving
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-zinc-600 hover:text-primary transition-colors">
                  Platform FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-600 hover:text-primary transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 mb-3.5">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-zinc-600 hover:text-primary transition-colors">
                  About EthioTech
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-zinc-600 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-zinc-600 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-xs text-zinc-500 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span>Platform Systems Operational</span>
            </span>
            <span>·</span>
            <span>© {new Date().getFullYear()} EthioTech Platform</span>
          </div>

          <p className="flex items-center gap-1.5 text-zinc-500">
            <span>Engineered with</span>
            <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
            <span>for East African youth</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
