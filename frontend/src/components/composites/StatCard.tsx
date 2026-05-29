import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015, borderColor: "rgba(0,210,255,0.25)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="cursor-pointer"
    >
      <Card className="relative overflow-hidden border border-white/5 bg-[rgba(16,20,28,0.45)] shadow-md p-5 select-none h-full">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.06),transparent_35%)]" />
        {icon && (
          <div className="absolute right-5 top-5 text-primary opacity-80 transition-transform duration-300 group-hover:scale-110">
            {icon}
          </div>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
        <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">{value}</p>
        {sub && <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">{sub}</p>}
        {trend && (
          <p className="mt-3 text-[11px] font-bold text-success flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {trend}
          </p>
        )}
      </Card>
    </motion.div>
  );
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-bold text-primary shadow-[0_0_8px_rgba(0,210,255,0.15)] backdrop-blur-sm select-none">
      <Zap size={12} className="fill-primary" />
      {xp.toLocaleString()} XP
    </span>
  );
}

export function RankProgress({
  level,
  xp,
  nextXp = 5000,
}: {
  level: number;
  xp: number;
  nextXp?: number;
}) {
  const pct = Math.min(100, Math.max(0, Math.round((xp / nextXp) * 100)));
  
  return (
    <div className="min-w-[200px] select-none">
      <div className="mb-1.5 flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
        <span>Lvl {level}</span>
        <span className="tabular-nums">
          {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-[#c084fc] shadow-[0_0_12px_rgba(0,210,255,0.5)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

