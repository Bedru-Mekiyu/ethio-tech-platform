import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden border border-white/5 bg-[rgba(16,20,28,0.45)] p-5 select-none h-full">
      {icon && <div className="absolute right-5 top-5 text-primary opacity-80">{icon}</div>}
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--text-secondary)]">{sub}</p>}
    </Card>
  );
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-bold text-primary backdrop-blur-sm select-none">
      {xp.toLocaleString()} XP
    </span>
  );
}

export function RankProgress({ level, xp, nextXp = 5000 }: { level: number; xp: number; nextXp?: number }) {
  const pct = Math.min(100, Math.max(0, Math.round((xp / nextXp) * 100)));

  return (
    <div className="min-w-[200px] select-none">
      <div className="mb-1.5 flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
        <span>Lvl {level}</span>
        <span className="tabular-nums">
          {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-[#c084fc] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
