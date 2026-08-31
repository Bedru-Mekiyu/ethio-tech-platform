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
    <motion.div initial="hidden" animate="show" className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 shadow-xl">
      {/* Back link */}
      <motion.div variants={fadeUp} custom={0}>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </motion.div>

      {/* Icon + Header */}
      <motion.div variants={fadeUp} custom={1} className="mt-5 space-y-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
          <KeyRound size={16} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white pt-2">Reset Password</h1>
        <p className="text-xs leading-relaxed text-zinc-400">
          Enter your account email to receive reset instructions.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeUp}
        custom={2}
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
              className="pl-10 text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...fieldAriaProps("email", errors.email?.message)}
              {...register("email")}
            />
          </div>
        </FormField>

        <Button type="submit" className="w-full font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Sending instructions…" : "Send Reset Link"}
        </Button>
      </motion.form>

      {/* Success message */}
      <div aria-live="polite">
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5"
          >
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            <p className="text-xs text-emerald-300">{message}</p>
          </motion.div>
        ) : null}
      </div>

      {/* Dev token (only in development) */}
      {import.meta.env.DEV && devToken ? (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <p className="font-semibold">Development reset token:</p>
          <code className="mt-1 block break-all font-mono text-[10px] text-amber-200">{devToken}</code>
          <Link
            to={`/auth/reset-password?token=${devToken}`}
            className="mt-2 inline-block text-xs font-medium text-amber-400 underline"
          >
            Continue with token →
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
