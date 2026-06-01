import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface LogoProps {
  className?: string;
  to?: string;
  variant?: "default" | "compact" | "full";
}

export function Logo({ className, to = "/", variant = "default" }: LogoProps) {
  const isCompact = variant === "compact";
  const isFull = variant === "full";

  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5 group select-none", className)} title="Back to home" aria-label="Back to home">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="relative flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-[#c084fc] shadow-[0_2px_10px_rgba(0,210,255,0.25)] group-hover:shadow-[0_4px_16px_rgba(0,210,255,0.45)] transition-shadow duration-300 overflow-hidden border border-white/10"
      >
        {/* Shimmer light effect inside the E mark */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        <span className="relative z-10 text-sm font-extrabold text-[var(--bg-base)] leading-none select-none">
          E
        </span>
      </motion.div>
      
      {!isCompact && (
        <div className="flex flex-col">
          <span className="font-bold text-white tracking-[0.01em] group-hover:text-primary transition-colors duration-200 text-[15px] leading-tight">
            EthioTech
          </span>
          {isFull && (
            <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] mt-0.5 select-none">
              East Africa
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

