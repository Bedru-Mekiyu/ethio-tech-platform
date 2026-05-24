import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { login } from "@/services/authService";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

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
      setAuth(result.user, result.accessToken, result.refreshToken);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? getDashboardPath(result.user.role));
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <Card className="mx-auto max-w-md border-primary/20 p-8">
      <div className="mb-6 flex rounded-lg bg-[var(--bg-elevated)] p-1">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => t === "signup" && navigate("/register")}
            className={cn(
              "flex-1 rounded-md py-2 text-sm capitalize",
              tab === t && "bg-primary text-[var(--bg-base)] font-medium"
            )}
          >
            {t === "login" ? "Login" : "Sign up"}
          </button>
        ))}
      </div>
      <h2 className="text-xl font-bold">Welcome back to EthioTech</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Enter your credentials to access your learning journey.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label>Email address</Label>
          <Input type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Continue to dashboard →"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        New to EthioTech?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
