import { Link, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";
import { register as registerApi, login } from "@/services/authService";
import { useAuthStore, getDashboardPath } from "@/store/authStore";

const schema = z
  .object({
    firstName: z.string().trim().min(2, "First name is required"),
    lastName: z.string().trim().min(2, "Last name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    gradeLevel: z.coerce.number().int().min(8).max(12).optional(),
    city: z.string().trim().max(120).optional(),
    learningInterests: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
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

export function RegisterPage() {
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
      const learningInterests = (data.learningInterests ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await registerApi({
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        gradeLevel: data.gradeLevel,
        city: data.city?.trim() || undefined,
        learningInterests: learningInterests.length ? learningInterests : undefined,
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
      <motion.div variants={fadeUp} custom={0} className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles size={12} />
          Student registration
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Build your tech future with EthioTech
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Join a mission-driven learning platform designed for Grade 8 students, high school learners, and
          future university engineers.
        </p>
      </motion.div>

      <motion.form
        variants={fadeUp}
        custom={1}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="firstName" label="First name" error={errors.firstName?.message}>
            <Input
              autoComplete="given-name"
              placeholder="Abel"
              {...fieldAriaProps("firstName", errors.firstName?.message)}
              {...register("firstName")}
            />
          </FormField>
          <FormField id="lastName" label="Last name" error={errors.lastName?.message}>
            <Input
              autoComplete="family-name"
              placeholder="Kebede"
              {...fieldAriaProps("lastName", errors.lastName?.message)}
              {...register("lastName")}
            />
          </FormField>
        </div>

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

        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...fieldAriaProps("confirmPassword", errors.confirmPassword?.message)}
            {...register("confirmPassword")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="gradeLevel" label="Grade level (optional)" error={errors.gradeLevel?.message}>
            <Select
              {...register("gradeLevel", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              id="gradeLevel"
              defaultValue=""
            >
              <option value="">Select your grade</option>
              {[8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField id="city" label="City (optional)" error={errors.city?.message}>
            <Input
              autoComplete="address-level2"
              placeholder="Addis Ababa"
              {...fieldAriaProps("city", errors.city?.message)}
              {...register("city")}
            />
          </FormField>
        </div>

        <FormField
          id="learningInterests"
          label="Learning interests (optional)"
          error={errors.learningInterests?.message}
          description="Separate interests with commas (for example: Web, AI, Cybersecurity)"
        >
          <Input
            placeholder="Web Development, AI, Mobile Apps"
            {...fieldAriaProps("learningInterests", errors.learningInterests?.message)}
            {...register("learningInterests")}
          />
        </FormField>

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
          {isSubmitting ? "Creating account…" : "Create student account"}
          {!isSubmitting && <ArrowRight size={16} />}
        </Button>
      </motion.form>

      <motion.div variants={fadeUp} custom={2} className="mt-6 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Want to mentor students?{" "}
          <Link to="/mentor-recruitment" className="font-semibold text-primary transition hover:text-[var(--primary-hover)]">
            Become a Mentor →
          </Link>
        </p>
      </motion.div>

      <motion.div variants={fadeUp} custom={3} className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-[var(--primary-hover)]"
        >
          Already have an account? Sign in
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    </motion.div>
  );
}
