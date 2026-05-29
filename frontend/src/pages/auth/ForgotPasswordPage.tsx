import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

type FormValues = z.infer<typeof schema>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema as never) as Resolver<FormValues> });

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setDevToken(null);
    const result = await forgotPassword(values.email);
    setMessage(result.message ?? "If that email exists, reset instructions were sent.");
    if (import.meta.env.DEV && result.devResetToken) {
      setDevToken(result.devResetToken);
    }
  };

  return (
    <motion.div initial="hidden" animate="show">
      {/* Back link */}
      <motion.div variants={fadeUp} custom={0}>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </motion.div>

      {/* Icon + Header */}
      <motion.div variants={fadeUp} custom={1} className="mt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.03]">
          <KeyRound size={22} className="text-primary" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Enter your account email and we&apos;ll send you instructions to reset your password.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeUp}
        custom={2}
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
              autoComplete="email"
              placeholder="you@example.com"
              {...fieldAriaProps("email", errors.email?.message)}
              {...register("email")}
            />
          </div>
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </motion.form>

      {/* Success message */}
      <div aria-live="polite">
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-xl border border-success/30 bg-[var(--success-muted)] px-4 py-3"
          >
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-success" />
            <p className="text-sm text-success">{message}</p>
          </motion.div>
        ) : null}
      </div>

      {/* Dev token (only in development) */}
      {import.meta.env.DEV && devToken ? (
        <div className="mt-4 rounded-xl border border-warning/30 bg-[var(--warning-muted)] p-4 text-sm text-warning">
          <p className="font-medium">Dev reset token:</p>
          <code className="mt-1 block break-all text-xs">{devToken}</code>
          <Link
            to={`/auth/reset-password?token=${devToken}`}
            className="mt-2 inline-block text-sm font-medium underline"
          >
            Open reset form →
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
