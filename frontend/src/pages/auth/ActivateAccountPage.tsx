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
      <motion.div
        initial="hidden"
        animate="show"
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-slate-900"
      >
        <motion.div variants={fadeUp} custom={0}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
            <ShieldCheck size={22} />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Missing activation token</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
    <motion.div
      initial="hidden"
      animate="show"
      className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
    >
      <motion.div variants={fadeUp} custom={0}>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="mt-5 space-y-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-700">
          <ShieldCheck size={16} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 pt-2">Activate Mentor Account</h1>
        <p className="text-xs leading-relaxed text-slate-500">
          Set a secure password to complete activation and access the mentor console.
        </p>
      </motion.div>

      <motion.form variants={fadeUp} custom={2} onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          description="Min 8 chars, letters & numbers"
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Create strong password"
            className="text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-zinc-900"
            {...fieldAriaProps("password", errors.password?.message)}
            {...register("password")}
          />
        </FormField>

        <FormField id="confirm" label="Confirm password" error={errors.confirm?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Re-enter password"
            className="text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-zinc-900"
            {...fieldAriaProps("confirm", errors.confirm?.message)}
            {...register("confirm")}
          />
        </FormField>

        {error ? (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5"
            role="alert"
          >
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-rose-600" />
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        ) : null}

        <Button type="submit" className="w-full font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Activating account…" : "Activate Account"}
        </Button>
      </motion.form>
    </motion.div>
  );
}
