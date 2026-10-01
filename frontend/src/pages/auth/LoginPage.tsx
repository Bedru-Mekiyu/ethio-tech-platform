import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail, AlertCircle, Loader2 } from "lucide-react";
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
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      if (response?.status === 401 || response?.status === 400) {
        setError(response.data?.message || "Invalid email or password. Please try again.");
      } else if (response?.status === 429) {
        setError("Too many sign-in attempts. Please wait a few moments and try again.");
      } else if (response?.status && response.status >= 500) {
        setError("The platform server is currently initializing or updating. Please try again in a moment.");
      } else {
        setError("Unable to connect to the authentication service. Please check your connection and try again.");
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 md:p-6 shadow-sm text-slate-900 dark:text-slate-100"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="space-y-1 text-center sm:text-left">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Enter your email and password to access your account.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form variants={fadeUp} custom={1} onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField id="email" label="Email address" error={errors.email?.message}>
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <Input
              className="pl-11 sm:pl-11 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus-visible:ring-slate-900 shadow-xs"
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
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <PasswordInput
              wrapperClassName="w-full"
              className="pl-11 sm:pl-11 pr-12 sm:pr-12 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus-visible:ring-slate-900 shadow-xs"
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
            className="text-xs font-medium text-slate-600 dark:text-slate-400 transition hover:text-slate-900 dark:hover:text-white"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-red-700 dark:text-red-400"
            role="alert"
          >
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-xs">{error}</p>
          </motion.div>
        ) : null}

        <Button type="submit" size="md" className="w-full font-semibold shadow-xs" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              <span>Signing in…</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span>Sign In</span>
              <ArrowRight size={15} />
            </span>
          )}
        </Button>
      </motion.form>

      {/* Footer */}
      <motion.div
        variants={fadeUp}
        custom={2}
        className="mt-6 border-t border-slate-100 dark:border-white/10 pt-5 text-center space-y-2.5"
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-slate-900 dark:text-white transition hover:text-slate-700 dark:hover:text-slate-200 ml-1 inline-flex items-center gap-1.5"
          >
            <span>Create Student Account</span>
            <ArrowRight size={13} />
          </Link>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Experienced engineer?{" "}
          <Link
            to="/mentor-recruitment"
            className="font-semibold text-slate-900 dark:text-white transition hover:text-slate-700 dark:hover:text-slate-200 ml-1 inline-flex items-center gap-1.5"
          >
            <span>Apply to Mentor</span>
            <ArrowRight size={13} />
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
