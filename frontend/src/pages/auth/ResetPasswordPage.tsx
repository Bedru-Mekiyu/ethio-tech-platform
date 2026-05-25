import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(8).regex(/[A-Za-z]/).regex(/\d/),
    confirm: z.string().min(8),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords must match", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
      await resetPassword(token, values.password);
      navigate("/login", { replace: true, state: { message: "Password updated. Sign in with your new password." } });
    } catch {
      setError("Invalid or expired reset link. Request a new one.");
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-danger">Missing reset token.</p>
        <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="text-sm text-[var(--text-secondary)]">
            New password
          </label>
          <Input id="password" type="password" className="mt-2" {...register("password")} />
          {errors.password ? <p className="mt-1 text-sm text-danger">{errors.password.message}</p> : null}
        </div>
        <div>
          <label htmlFor="confirm" className="text-sm text-[var(--text-secondary)]">
            Confirm password
          </label>
          <Input id="confirm" type="password" className="mt-2" {...register("confirm")} />
          {errors.confirm ? <p className="mt-1 text-sm text-danger">{errors.confirm.message}</p> : null}
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
