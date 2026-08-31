import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { activateAccount } from "@/services/authService";
import { useAuthStore, getPostLoginPath } from "@/store/authStore";
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

export function ActivateAccountPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema as never) as Resolver<FormValues> });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const result = await activateAccount(token, values.password);
      setAuth(result.user, result.accessToken);
      navigate(getPostLoginPath(result.user.role, result.authFlags), { replace: true });
    } catch {
      setError("Invalid or expired activation link. Contact support to resend credentials.");
    }
  };

  if (!token) {
    return (
      <motion.div initial="hidden" animate="show">
        <motion.div variants={fadeUp} custom={0}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[0.03]">
            <ShieldCheck size={22} className="text-danger" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Missing activation token</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            This link appears to be invalid or expired. Please contact support for a new activation link.
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="outline">Go to sign in</Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 shadow-xl">
      <motion.div variants={fadeUp} custom={0}>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="mt-5 space-y-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-400">
          <ShieldCheck size={16} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white pt-2">Activate Mentor Account</h1>
        <p className="text-xs leading-relaxed text-zinc-400">
          Set a secure password to complete activation and access the mentor console.
        </p>
      </motion.div>

      <motion.form
        variants={fadeUp}
        custom={2}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <FormField id="password" label="Password" error={errors.password?.message} description="Min 8 chars, letters & numbers">
          <PasswordInput
            autoComplete="new-password"
            placeholder="Create strong password"
            className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
            {...fieldAriaProps("password", errors.password?.message)}
            {...register("password")}
          />
        </FormField>

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
          <div
            className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5"
            role="alert"
          >
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        ) : null}

        <Button type="submit" className="w-full font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Activating account…" : "Activate Account"}
        </Button>
      </motion.form>
    </motion.div>
  );
}
