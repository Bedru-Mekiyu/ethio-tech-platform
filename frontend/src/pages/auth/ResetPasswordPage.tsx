import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { resetPassword } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirm: z.string().min(8, "Must be at least 8 characters"),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords must match", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function getPasswordStrength(password: string): { label: string; percent: number; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", percent: 25, color: "var(--danger)" };
  if (score <= 3) return { label: "Fair", percent: 50, color: "var(--warning)" };
  if (score <= 4) return { label: "Good", percent: 75, color: "var(--primary)" };
  return { label: "Strong", percent: 100, color: "var(--success)" };
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema as never) as Resolver<FormValues> });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await resetPassword(token, values.password);
      navigate("/login", {
        replace: true,
        state: { message: "Password updated. Sign in with your new password." },
      });
    } catch {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  };

  if (!token) {
    return (
      <motion.div initial="hidden" animate="show">
        <motion.div variants={fadeUp} custom={0}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.03]">
            <ShieldCheck size={22} className="text-danger" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Missing reset token</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            This link appears to be invalid or expired. Please request a new password reset.
          </p>
          <div className="mt-6">
            <Link to="/auth/forgot-password">
              <Button variant="outline">Request new reset link</Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

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
          <ShieldCheck size={16} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white pt-2">Set New Password</h1>
        <p className="text-xs leading-relaxed text-zinc-400">
          Must be at least 8 characters containing letters and numbers.
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
        <div>
          <FormField id="password" label="New password" error={errors.password?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Create strong password"
              className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              {...fieldAriaProps("password", errors.password?.message)}
              {...register("password")}
            />
          </FormField>
          {/* Strength meter */}
          {passwordValue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 space-y-1"
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: strength.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.percent}%` }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                />
              </div>
              <p className="text-[11px] font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </motion.div>
          )}
        </div>

        <FormField id="confirm" label="Confirm password" error={errors.confirm?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Re-enter password"
            className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
            {...fieldAriaProps("confirm", errors.confirm?.message)}
            {...register("confirm")}
          />
        </FormField>

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

        <Button type="submit" className="w-full font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Updating password…" : "Save New Password"}
        </Button>
      </motion.form>
    </motion.div>
  );
}
