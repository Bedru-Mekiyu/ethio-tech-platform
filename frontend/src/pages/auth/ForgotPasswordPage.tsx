import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({ email: z.string().email() });

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema as never) as Resolver<FormValues> });

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setDevToken(null);
    const result = await forgotPassword(values.email);
    setMessage(result.message ?? "If that email exists, reset instructions were sent.");
    if (result.devResetToken) {
      setDevToken(result.devResetToken);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter your account email and we will send reset instructions.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm text-[var(--text-secondary)]">
            Email
          </label>
          <Input id="email" type="email" className="mt-2" {...register("email")} />
          {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {devToken ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          Dev reset token: <code className="break-all">{devToken}</code>
          <br />
          <Link to={`/auth/reset-password?token=${devToken}`} className="underline">
            Open reset form
          </Link>
        </p>
      ) : null}
      <Link to="/login" className="text-sm text-primary hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
