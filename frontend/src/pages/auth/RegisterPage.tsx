import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AuthNavTabs } from "@/components/auth/AuthNavTabs";
import { RolePicker } from "@/components/auth/RolePicker";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";
import { register as registerApi, login } from "@/services/authService";
import { useAuthStore, getDashboardPath } from "@/store/authStore";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Za-z]/, "Use at least one letter").regex(/\d/, "Use at least one number"),
  gradeLevel: z.coerce.number().min(8).max(12).optional(),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const [params] = useSearchParams();
  const role = params.get("role") === "mentor" ? "mentor" : "student";
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
      setError("Registration failed. Email may already be in use.");
    }
  };

  return (
    <Card className="mx-auto w-full max-w-lg border-primary/20 bg-[linear-gradient(180deg,rgba(12,18,30,0.98),rgba(6,10,18,0.98))] p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] md:p-8">

      <div className="mt-6 space-y-4">
        <RolePicker />
        <h2 className="text-2xl font-bold tracking-tight text-white">Create your {role} profile</h2>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          Join Ethiopia&apos;s immersive tech education movement.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
          <Input autoComplete="name" {...fieldAriaProps("fullName", errors.fullName?.message)} {...register("fullName")} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...fieldAriaProps("email", errors.email?.message)} {...register("email")} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <PasswordInput autoComplete="new-password" {...fieldAriaProps("password", errors.password?.message)} {...register("password")} />
        </FormField>
        {role === "student" ? (
          <FormField id="gradeLevel" label="Grade level" error={errors.gradeLevel?.message}>
            <Select {...register("gradeLevel")} id="gradeLevel" defaultValue="">
              <option value="">Select grade</option>
              {[8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
        {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
        <Button type="submit" className="w-full min-h-11" disabled={isSubmitting}>
          Create profile
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
