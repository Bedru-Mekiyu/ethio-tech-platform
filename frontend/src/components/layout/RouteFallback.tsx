import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

export function RouteFallback({ label = "Loading your learning space" }: { label?: string }) {
  return (
    <div
      className="page-shell flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 px-4 py-16 text-center select-none"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-xl scale-125 animate-pulse" aria-hidden="true" />
        <Logo to="/" variant="full" className="scale-110" />
      </motion.div>
      
      <div className="flex flex-col items-center gap-1.5 text-center mt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary animate-pulse">
          {label}
        </p>
        <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide">
          Syncing secure platform data...
        </span>
      </div>

      <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/5 relative" aria-hidden="true">
        <motion.div
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-primary to-transparent"
        />
      </div>
    </div>
  );
}
