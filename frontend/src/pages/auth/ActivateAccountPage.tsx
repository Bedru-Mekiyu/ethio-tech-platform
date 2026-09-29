import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
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
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
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
        className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-slate-900 dark:text-slate-100 space-y-5"
      >
        <motion.div variants={fadeUp} custom={0} className="space-y-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-slate-200">
            <ShieldCheck size={22} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Missing Activation Token
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              This activation link appears to be invalid or expired. Please contact support or check your email for a
              new invitation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/login">
              <Button variant="primary" size="md" className="font-semibold shadow-xs">
                Sign In
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="md" className="font-semibold shadow-xs">
                Contact Support
              </Button>
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
      className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-slate-900 dark:text-slate-100 space-y-6"
    >
      <motion.div variants={fadeUp} custom={0}>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={13} />
          Back to Sign In
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-slate-200">
          <ShieldCheck size={18} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
          Activate Mentor Account
        </h1>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Set a secure permanent password to complete activation and access the mentor console.
        </p>
      </motion.div>

      <motion.form variants={fadeUp} custom={2} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="password"
          label="Permanent Password"
          error={errors.password?.message}
          description="Minimum 8 characters, including letters & numbers."
          required
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Create strong password"
            {...fieldAriaProps("password", errors.password?.message)}
            {...register("password")}
          />
        </FormField>

        <FormField id="confirm" label="Confirm Permanent Password" error={errors.confirm?.message} required>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Re-enter permanent password"
            {...fieldAriaProps("confirm", errors.confirm?.message)}
            {...register("confirm")}
          />
        </FormField>

        {error ? (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
            role="alert"
          >
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p>{error}</p>
          </div>
        ) : null}

        <Button type="submit" size="md" className="w-full font-semibold shadow-xs" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Activating Account...
            </>
          ) : (
            "Activate Account"
          )}
        </Button>
      </motion.form>
    </motion.div>
  );
}
