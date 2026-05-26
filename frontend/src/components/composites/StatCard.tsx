import { Card } from "@/components/ui/card";

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
    <Card className="relative overflow-hidden border-[var(--border)] bg-[var(--bg-card)]/90">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.08),transparent_35%)]" />
      {icon && <div className="absolute right-4 top-4 opacity-60">{icon}</div>}
      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{sub}</p>}
      {trend && <p className="mt-3 text-xs font-medium text-success">{trend}</p>}
    </Card>
  );
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
      ⚡ {xp.toLocaleString()} XP
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
  return (
    <div className="min-w-[200px]">
      <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
        <span>Lvl {level}</span>
        <span>
          {xp} / {nextXp} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          style={{ width: `${Math.min(100, (xp / nextXp) * 100)}%` }}
        />
      </div>
    </div>
  );
}
