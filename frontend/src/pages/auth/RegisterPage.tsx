import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, GraduationCap, Lightbulb, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";
import { register as registerApi, login } from "@/services/authService";
import { useAuthStore, getDashboardPath } from "@/store/authStore";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/\d/, "Include at least one number"),
  gradeLevel: z.coerce.number().min(8).max(12).optional(),
});

type FormData = z.infer<typeof schema>;

type Role = "student" | "mentor";

const roles = [
  {
    value: "student" as Role,
    icon: GraduationCap,
    title: "I'm a Student",
    desc: "Learn through immersive tracks, projects, and mentor sessions",
  },
  {
    value: "mentor" as Role,
    icon: Lightbulb,
    title: "I'm a Mentor",
    desc: "Guide the next generation of Ethiopian tech talent",
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const formVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export function RegisterPage() {
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "mentor" ? "mentor" : "student";
  const [role, setRole] = useState<Role>(initialRole);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema as never) as Resolver<FormData> });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await registerApi({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role,
        gradeLevel: role === "student" ? data.gradeLevel : undefined,
      });
      const result = await login(data.email, data.password);
      setAuth(result.user, result.accessToken);
      navigate(getDashboardPath(result.user.role));
    } catch {
      setError("Registration failed. This email may already be in use.");
    }
  };

  return (
    <motion.div initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Create your account
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Choose how you want to join EthioTech.
        </p>
      </motion.div>

      {/* Role Selection Cards */}
      <motion.div variants={fadeUp} custom={1} className="mt-6 grid grid-cols-2 gap-3">
        {roles.map(({ value, icon: Icon, title, desc }) => {
          const isSelected = role === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary/50 bg-[var(--primary-subtle)] shadow-[var(--shadow-glow-sm)]"
                  : "border-[var(--border)] bg-white/[0.02] hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
              }`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <motion.div
                  layoutId="role-check"
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Check size={12} className="text-[var(--bg-base)]" />
                </motion.div>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  isSelected
                    ? "bg-[var(--primary-muted)] text-primary"
                    : "bg-white/5 text-[var(--text-muted)]"
                }`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-[var(--text-secondary)]"}`}>
                  {title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-[var(--text-muted)]">{desc}</p>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.form
          key={role}
          variants={formVariants}
          initial="enter"
          animate="center"
          exit="exit"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
            <Input
              autoComplete="name"
              placeholder="Your full name"
              {...fieldAriaProps("fullName", errors.fullName?.message)}
              {...register("fullName")}
            />
          </FormField>

          <FormField id="email" label="Email address" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...fieldAriaProps("email", errors.email?.message)}
              {...register("email")}
            />
          </FormField>

          <FormField id="password" label="Password" error={errors.password?.message} description="Min 8 chars with letters and numbers">
            <PasswordInput
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...fieldAriaProps("password", errors.password?.message)}
              {...register("password")}
            />
          </FormField>

          {role === "student" ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <FormField id="gradeLevel" label="Grade level" error={errors.gradeLevel?.message}>
                <Select {...register("gradeLevel")} id="gradeLevel" defaultValue="">
                  <option value="">Select your grade</option>
                  {[8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </Select>
              </FormField>
            </motion.div>
          ) : null}

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

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : `Create ${role} account`}
            {!isSubmitting && <ArrowRight size={16} />}
          </Button>
        </motion.form>
      </AnimatePresence>

      {/* Footer */}
      <motion.div variants={fadeUp} custom={3} className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--bg-base)] px-3 text-[var(--text-muted)]">
              Already have an account?
            </span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-[var(--primary-hover)]"
          >
            Sign in instead
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
