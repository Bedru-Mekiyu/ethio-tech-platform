import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface LogoProps {
  className?: string;
  to?: string;
  variant?: "default" | "compact" | "full";
  subtitle?: string;
}

export function Logo({ className, to = "/", variant = "default", subtitle }: LogoProps) {
  const isCompact = variant === "compact";
  const isFull = variant === "full";

  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-3 group select-none", className)}
      title="EthioTech Platform"
      aria-label="EthioTech Platform - Back to home"
    >
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all duration-200 overflow-hidden border border-indigo-400/30"
      >
        <span className="relative z-10 text-base font-black text-white leading-none select-none tracking-tight">
          E
        </span>
      </motion.div>

      {!isCompact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white tracking-[-0.01em] group-hover:text-primary transition-colors duration-200 text-base leading-tight">
              Ethio<span className="text-primary">Tech</span>
            </span>
          </div>
          {isFull ? (
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] mt-0.5 select-none">
              {subtitle || "East Africa · PISTELS"}
            </span>
          ) : subtitle ? (
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] mt-0.5 select-none">
              {subtitle}
            </span>
          ) : null}
        </div>
      )}
    </Link>
  );
}
