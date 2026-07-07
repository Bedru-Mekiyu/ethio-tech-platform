import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";
import { login } from "@/services/authService";
import { useAuthStore, getPostLoginPath } from "@/store/authStore";
import { useToast } from "@/components/composites/ToastProvider";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const toast = useToast();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema as never) as Resolver<FormData> });

  useEffect(() => {
    const message = (location.state as { message?: string } | null)?.message;
    if (message) {
      toast.success(message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, toast]);

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const result = await login(data.email, data.password);
      setAuth(result.user, result.accessToken);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? getPostLoginPath(result.user.role, result.authFlags));
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <motion.div initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome back
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Sign in to continue your learning journey.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeUp}
        custom={1}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        <FormField id="email" label="Email address" error={errors.email?.message}>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <Input
              className="pl-11"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...fieldAriaProps("email", errors.email?.message)}
              {...register("email")}
            />
          </div>
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message}>
          <div className="relative">
            <LockKeyhole
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <PasswordInput
              wrapperClassName="w-full"
              className="pl-11"
              placeholder="••••••••"
              autoComplete="current-password"
              {...fieldAriaProps("password", errors.password?.message)}
              {...register("password")}
            />
          </div>
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-danger/30 bg-[var(--danger-muted)] px-4 py-3"
            role="alert"
          >
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </motion.div>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
          {!isSubmitting && <ArrowRight size={16} />}
        </Button>
      </motion.form>

      {/* Footer */}
      <motion.div variants={fadeUp} custom={2} className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--bg-base)] px-3 text-[var(--text-muted)]">
              New to EthioTech?
            </span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-[var(--primary-hover)]"
          >
            Create your free account
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
