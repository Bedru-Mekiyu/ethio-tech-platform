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
    <motion.div initial="hidden" animate="show" className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 shadow-xl">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="space-y-1 text-center sm:text-left">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Sign In
        </h2>
        <p className="text-xs text-zinc-400">
          Enter your credentials to access your engineering workspace.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeUp}
        custom={1}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <FormField id="email" label="Email address" error={errors.email?.message}>
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-zinc-500"
            />
            <Input
              className="pl-10 text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500 focus-visible:ring-violet-500"
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
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-zinc-500"
            />
            <PasswordInput
              wrapperClassName="w-full"
              className="pl-10 text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500 focus-visible:ring-violet-500"
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
            className="text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5"
            role="alert"
          >
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        ) : null}

        <Button
          type="submit"
          className="w-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in to Platform"}
          {!isSubmitting && <ArrowRight size={14} className="ml-1" />}
        </Button>
      </motion.form>

      {/* Footer */}
      <motion.div variants={fadeUp} custom={2} className="mt-6 border-t border-[#27272A] pt-5 text-center">
        <p className="text-xs text-zinc-400">
          New to EthioTech?{" "}
          <Link
            to="/register"
            className="font-medium text-violet-400 transition hover:text-violet-300 ml-1 inline-flex items-center gap-1"
          >
            Create free account
            <ArrowRight size={12} />
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
