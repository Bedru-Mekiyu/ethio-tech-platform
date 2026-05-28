import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, LayoutDashboard, Lock, UserCircle2 } from "lucide-react";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { logoutApi, changePassword } from "@/services/authService";
import { updateMyProfile } from "@/services/userService";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const profileSchema = z.object({
  fullName: z.string().min(2).max(120),
  bio: z.string().max(1000).optional(),
  phone: z.string().max(40).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "Passwords must match", path: ["confirm"] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function SettingsPage({ scope }: { scope: "student" | "mentor" | "admin" | "parent" }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any)?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarPreview((user as any)?.avatar ?? null);
  }, [(user as any)?.avatar]);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema as never) as Resolver<ProfileForm>,
    defaultValues: { fullName: user?.fullName ?? "", bio: "", phone: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema as never) as Resolver<PasswordForm>,
  });

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const onProfileSubmit = async (values: ProfileForm) => {
    setProfileMessage(null);
    try {
      const payload: any = { ...values };
      if (avatarFile && avatarPreview) {
        // Send small preview data URL as avatar fallback (backend expects avatar URL/string)
        payload.avatar = avatarPreview;
      }
      const updated = await updateMyProfile(payload);
      setUser({ ...user!, ...updated });
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileMessage("Could not update profile.");
    }
  };

  const onPasswordSubmit = async (values: PasswordForm) => {
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setPasswordMessage("Password changed successfully.");
      passwordForm.reset();
    } catch {
      setPasswordError("Could not change password. Check your current password.");
    }
  };

  const dashboardPath = getDashboardPath(scope);

  return (
    <div className="space-y-8">
      <Card className="rounded-[28px] border-primary/20 bg-[var(--bg-card)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={avatarPreview ?? undefined} name={user?.fullName ?? "User"} size="lg" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -right-1 -bottom-1 rounded-full bg-[var(--bg-card)]/80 p-2 text-sm shadow-md hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Upload profile photo"
              >
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!f.type.startsWith("image/")) {
                    setAvatarError("Please select an image file.");
                    return;
                  }
                  if (f.size > 2_000_000) {
                    setAvatarError("Image must be smaller than 2 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setAvatarPreview(String(reader.result));
                    setAvatarFile(f);
                    setAvatarError(null);
                  };
                  reader.readAsDataURL(f);
                }}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
              <Badge variant="purple" className="mt-2">
                {scope}
              </Badge>
              {avatarError ? <p className="mt-2 text-sm text-danger">{avatarError}</p> : null}
              {avatarFile ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="text-sm text-primary underline"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview((user as any)?.avatar ?? null);
                    }}
                  >
                    Remove selection
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex gap-3">
            <Link to={dashboardPath}>
              <Button variant="outline">
                <LayoutDashboard size={16} /> Dashboard
              </Button>
            </Link>
            <Button variant="secondary" type="button" onClick={handleLogout}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 size={18} /> Profile
            </CardTitle>
          </CardHeader>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-4 space-y-4">
            <div>
              <label htmlFor="fullName" className="text-sm text-[var(--text-secondary)]">
                Full name
              </label>
              <Input id="fullName" className="mt-2" {...profileForm.register("fullName")} />
            </div>
            <div>
              <label htmlFor="bio" className="text-sm text-[var(--text-secondary)]">
                Bio
              </label>
              <Input id="bio" className="mt-2" {...profileForm.register("bio")} />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm text-[var(--text-secondary)]">
                Phone
              </label>
              <Input id="phone" className="mt-2" {...profileForm.register("phone")} />
            </div>
            {profileMessage ? <p className="text-sm text-success">{profileMessage}</p> : null}
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2">
              <Lock size={18} /> Password
            </CardTitle>
          </CardHeader>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 space-y-4">
            <Input
              type="password"
              placeholder="Current password"
              aria-label="Current password"
              {...passwordForm.register("currentPassword")}
            />
            <Input
              type="password"
              placeholder="New password"
              aria-label="New password"
              {...passwordForm.register("newPassword")}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              aria-label="Confirm new password"
              {...passwordForm.register("confirm")}
            />
            {passwordError ? <p className="text-sm text-danger">{passwordError}</p> : null}
            {passwordMessage ? <p className="text-sm text-success">{passwordMessage}</p> : null}
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              Update password
            </Button>
            <Link to="/auth/forgot-password" className="block text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </form>
        </Card>
      </div>
    </div>
  );
}
