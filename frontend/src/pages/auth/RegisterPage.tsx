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
    <motion.div initial="hidden" animate="show" className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 shadow-xl">
      <motion.div variants={fadeUp} custom={0} className="space-y-1.5 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-400">
          <Sparkles size={11} />
          <span>Student Registration</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Create Student Account
        </h2>
        <p className="text-xs text-zinc-400">
          Join hands-on software engineering tracks with senior mentor support.
        </p>
      </motion.div>

      <motion.form
        variants={fadeUp}
        custom={1}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="firstName" label="First name" error={errors.firstName?.message}>
            <Input
              autoComplete="given-name"
              placeholder="Abel"
              className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              {...fieldAriaProps("firstName", errors.firstName?.message)}
              {...register("firstName")}
            />
          </FormField>
          <FormField id="lastName" label="Last name" error={errors.lastName?.message}>
            <Input
              autoComplete="family-name"
              placeholder="Kebede"
              className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
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
            className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
            {...fieldAriaProps("email", errors.email?.message)}
            {...register("email")}
          />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="password" label="Password" error={errors.password?.message} description="Min 8 chars, letters & numbers">
            <PasswordInput
              autoComplete="new-password"
              placeholder="Create password"
              className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              {...fieldAriaProps("password", errors.password?.message)}
              {...register("password")}
            />
          </FormField>

          <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="Confirm password"
              className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              {...fieldAriaProps("confirmPassword", errors.confirmPassword?.message)}
              {...register("confirmPassword")}
            />
          </FormField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="gradeLevel" label="Grade level (optional)" error={errors.gradeLevel?.message}>
            <Select
              {...register("gradeLevel", {
                setValueAs: (value) => (value === "" ? undefined : Number(value)),
              })}
              id="gradeLevel"
              defaultValue=""
              className="text-xs bg-[#141418] border-[#27272A] text-white"
            >
              <option value="">Select grade level</option>
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
              placeholder="e.g. Addis Ababa"
              className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              {...fieldAriaProps("city", errors.city?.message)}
              {...register("city")}
            />
          </FormField>
        </div>

        <FormField
          id="learningInterests"
          label="Learning interests (optional)"
          error={errors.learningInterests?.message}
          description="e.g. Fullstack Web, Mobile Apps, Cloud Architecture"
        >
          <Input
            placeholder="Web, Mobile, AI, Cloud"
            className="text-xs bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
            {...fieldAriaProps("learningInterests", errors.learningInterests?.message)}
            {...register("learningInterests")}
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
          {isSubmitting ? "Creating account…" : "Create Student Account"}
          {!isSubmitting && <ArrowRight size={14} className="ml-1" />}
        </Button>
      </motion.form>

      <motion.div variants={fadeUp} custom={2} className="mt-5 rounded-lg border border-[#27272A] bg-[#141418] p-3 text-center">
        <p className="text-xs text-zinc-400">
          Want to mentor students?{" "}
          <Link to="/mentor-recruitment" className="font-medium text-violet-400 hover:text-violet-300 ml-1">
            Apply as Mentor →
          </Link>
        </p>
      </motion.div>

      <motion.div variants={fadeUp} custom={3} className="mt-5 border-t border-[#27272A] pt-4 text-center">
        <p className="text-xs text-zinc-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-violet-400 transition hover:text-violet-300 ml-1 inline-flex items-center gap-1"
          >
            Sign in
            <ArrowRight size={12} />
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
