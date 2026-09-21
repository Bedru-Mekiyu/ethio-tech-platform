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
    <Card className="relative overflow-hidden border border-zinc-200 bg-white p-4 sm:p-5 select-none h-full shadow-xs">
      {icon && <div className="absolute right-4.5 top-4.5 text-zinc-400">{icon}</div>}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
      {sub && <p className="mt-1.5 text-xs font-medium leading-relaxed text-[var(--text-secondary)]">{sub}</p>}
    </Card>
  );
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-900 select-none">
      {xp.toLocaleString()} XP
    </span>
  );
}

export function RankProgress({ level, xp, nextXp = 5000 }: { level: number; xp: number; nextXp?: number }) {
  const pct = Math.min(100, Math.max(0, Math.round((xp / nextXp) * 100)));

  return (
    <div className="min-w-[200px] select-none">
      <div className="mb-1.5 flex justify-between text-xs font-medium text-[var(--text-secondary)]">
        <span>Lvl {level}</span>
        <span className="tabular-nums font-semibold text-zinc-900">
          {xp.toLocaleString()} / {nextXp.toLocaleString()} XP
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 border border-zinc-200/60">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
