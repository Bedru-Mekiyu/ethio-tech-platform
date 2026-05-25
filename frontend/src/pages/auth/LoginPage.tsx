import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { login } from "@/services/authService";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

const supportPills = ["Realtime rooms", "Mentor review", "Secure tokens"] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const [tab] = useState<"login" | "signup">("login");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema as never) as Resolver<FormData> });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const result = await login(data.email, data.password);
      setAuth(result.user, result.accessToken);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? getDashboardPath(result.user.role));
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <Card className="mx-auto w-full max-w-lg border-primary/20 bg-[linear-gradient(180deg,rgba(12,18,30,0.98),rgba(6,10,18,0.98))] p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          {(["login", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => item === "signup" && navigate("/register")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                tab === item ? "bg-primary text-[var(--bg-base)]" : "text-[var(--text-secondary)] hover:text-white"
              )}
            >
              {item === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>
        <Badge variant="purple">Secure access</Badge>
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Welcome back to <span className="glow-text">EthioTech</span>
        </h2>
        <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          Pick up your immersive classroom where you left off. Your dashboard, mentors, and live sessions stay synced in one account.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {supportPills.map((pill) => (
          <div key={pill} className="rounded-2xl border border-[var(--border)] bg-white/5 px-3 py-2 text-center text-xs text-[var(--text-secondary)]">
            {pill}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label>Email address</Label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input className="pl-10" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input className="pl-10" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
          </div>
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
          <Link to="/contact" className="text-[var(--text-secondary)] hover:text-white">
            Need help?
          </Link>
        </div>

        {error ? <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Continue to dashboard"}
          <ArrowRight size={16} />
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <ShieldCheck size={16} className="text-primary" />
          Protected classroom access
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Authentication is role-aware, short-lived, and ready for mentor, student, parent, and admin sessions.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        New here?{" "}
        <Link to="/register" className="inline-flex items-center gap-1 text-primary hover:underline">
          Create your account <Sparkles size={14} />
        </Link>
      </p>
    </Card>
  );
}
