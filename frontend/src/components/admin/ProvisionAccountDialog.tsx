import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProvisionAccountDialogProps {
  open: boolean;
  defaultEmail: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (email: string, password: string) => void;
}

export function ProvisionAccountDialog({
  open,
  defaultEmail,
  loading,
  onClose,
  onConfirm,
}: ProvisionAccountDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must include at least one letter and one number");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onConfirm(email.trim(), password);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create mentor account"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Create Mentor Account</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          Set the email and password for the mentor account. The mentor will use these credentials to sign in.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="mentor@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="At least 8 characters, with letter and number"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="Repeat the password"
            />
          </div>

          {error && <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
