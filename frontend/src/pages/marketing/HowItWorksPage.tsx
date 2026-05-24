import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const phases = [
  {
    n: "01",
    title: "Immersive Learning",
    desc: "Live interactive sessions and virtual spaces with mentors and peers.",
    side: "right" as const,
  },
  {
    n: "02",
    title: "Build Real Projects",
    desc: "Ship portfolio projects reviewed by industry mentors. Earn XP for quality.",
    side: "left" as const,
  },
  {
    n: "03",
    title: "Level Up & Rank",
    desc: "Collect badges, climb leaderboards, and unlock mentorship opportunities.",
    side: "right" as const,
  },
];

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <p className="text-center text-xs uppercase tracking-widest text-primary">Stepping into the future</p>
      <h1 className="mt-4 text-center text-4xl font-bold">
        Your Journey to <span className="text-secondary">Tech Mastery</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-[var(--text-secondary)]">
        A gamified path from first line of code to job-ready engineer.
      </p>

      <div className="relative mt-16">
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-primary/40 md:block" />
        {phases.map((phase) => (
          <div
            key={phase.n}
            className={`relative mb-16 grid gap-8 md:grid-cols-2 ${
              phase.side === "left" ? "md:[&>div:first-child]:order-2" : ""
            }`}
          >
            <Card>
              <span className="text-primary font-mono text-sm">{phase.n}</span>
              <h2 className="mt-2 text-xl font-bold">{phase.title}</h2>
              <p className="mt-2 text-[var(--text-secondary)]">{phase.desc}</p>
            </Card>
            <div className="hidden aspect-video rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent md:block" />
            <span className="absolute left-1/2 top-8 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-[var(--bg-base)] text-xs font-bold text-primary md:flex">
              {phase.n.replace("0", "")}
            </span>
          </div>
        ))}
      </div>

      <Card className="mt-12 text-center">
        <h2 className="text-xl font-bold">Start Your Gamified Journey Today</h2>
        <Link to="/register" className="mt-6 inline-block">
          <Button size="lg">Create Your Profile →</Button>
        </Link>
      </Card>
    </div>
  );
}
