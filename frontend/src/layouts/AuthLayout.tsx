import { Outlet, Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.12),transparent_28%),linear-gradient(135deg,#050a14_0%,#07111f_40%,#050a14_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
        <Card className="hidden border-primary/20 bg-[rgba(11,14,20,0.84)] p-8 lg:block">
          <Logo />
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Revolutionary learning for the next generation
          </p>
          <h1 className="mt-8 text-3xl font-bold leading-tight">
            Sign in to your <span className="text-primary">immersive classroom</span>
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            Interactive sessions, gamified XP, mentorship from global engineers, and 3D virtual labs.
          </p>
          <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div className="mb-4 flex justify-between text-xs text-[var(--text-muted)]">
              <span>Active Students</span>
              <span>Skill tracks</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {["Software Eng", "Cloud", "Cyber"].map((t) => (
                <div key={t} className="rounded-lg bg-white/5 p-2 text-center">
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ProgressBar value={98} color="primary" />
              <p className="mt-1 text-xs text-[var(--text-muted)]">Platform engagement 98.2%</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link to="/register?role=student">
              <Button>Student Access</Button>
            </Link>
            <Link to="/register?role=mentor">
              <Button variant="outline">Mentor Access</Button>
            </Link>
          </div>
        </Card>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
