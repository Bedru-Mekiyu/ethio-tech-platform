import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { register as registerApi, login } from "@/services/authService";
import { useAuthStore, getDashboardPath } from "@/store/authStore";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  gradeLevel: z.coerce.number().min(8).max(12).optional(),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const [params] = useSearchParams();
  const role = (params.get("role") as "student" | "mentor") || "student";
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
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate(getDashboardPath(result.user.role));
    } catch {
      setError("Registration failed. Email may already be in use.");
    }
  };

  return (
    <Card className="mx-auto max-w-md p-8">
      <h2 className="text-xl font-bold">Create your {role} profile</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Join Ethiopia&apos;s immersive tech education movement.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label>Full name</Label>
          <Input {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" {...register("email")} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" {...register("password")} />
        </div>
        {role === "student" && (
          <div>
            <Label>Grade level</Label>
            <Input type="number" min={8} max={12} {...register("gradeLevel")} />
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create profile
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-primary">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
