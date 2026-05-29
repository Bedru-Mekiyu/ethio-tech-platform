import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, LayoutDashboard, Lock, UserCircle2, Sparkles } from "lucide-react";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { logoutApi, changePassword } from "@/services/authService";
import { updateMyProfile, uploadAvatar, getMyProfile } from "@/services/userService";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";
import { FileInput } from "@/components/ui/file-input";
import { useToast } from "@/components/composites/ToastProvider";
import { motion } from "framer-motion";

const profileSchema = z.object({
  fullName: z.string().min(2).max(120),
  bio: z.string().max(1000).optional(),
  phone: z.string().max(40).optional(),
  gradeLevel: z.coerce.number().int().min(8).max(12).optional(),
  expertise: z.string().max(500).optional(),
  currentCompany: z.string().max(120).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirm: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "Passwords must match", path: ["confirm"] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

export function SettingsPage({ scope }: { scope: "student" | "mentor" | "admin" | "parent" }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const toast = useToast();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => user?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema as never) as Resolver<ProfileForm>,
    defaultValues: {
      fullName: user?.fullName ?? "",
      bio: user?.bio ?? "",
      phone: user?.phone ?? "",
      gradeLevel: user?.gradeLevel,
      expertise: user?.expertise?.join(", ") ?? "",
      currentCompany: user?.currentCompany ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema as never) as Resolver<PasswordForm>,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        setUser(profile);
        profileForm.reset({
          fullName: profile.fullName,
          bio: profile.bio ?? "",
          phone: profile.phone ?? "",
          gradeLevel: profile.gradeLevel,
          expertise: profile.expertise?.join(", ") ?? "",
          currentCompany: profile.currentCompany ?? "",
        });
        setAvatarPreview(profile.avatar ?? null);
      } catch {
        if (user) {
          profileForm.reset({
            fullName: user.fullName,
            bio: user.bio ?? "",
            phone: user.phone ?? "",
            gradeLevel: user.gradeLevel,
            expertise: user.expertise?.join(", ") ?? "",
            currentCompany: user.currentCompany ?? "",
          });
          setAvatarPreview(user.avatar ?? null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarPick = (file: File | null, preview?: string) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(user?.avatar ?? null);
      setAvatarError(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5_000_000) {
      setAvatarError("Image must be smaller than 5 MB.");
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(preview ?? user?.avatar ?? null);
    setAvatarError(null);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const onProfileSubmit = async (values: ProfileForm) => {
    try {
      let latest = user!;
      if (avatarFile) {
        latest = await uploadAvatar(avatarFile, (pct) => setUploadProgress(pct));
        setUploadProgress(null);
        setAvatarFile(null);
        setAvatarPreview(latest.avatar ?? null);
      }

      const payload = {
        fullName: values.fullName,
        bio: values.bio,
        phone: values.phone,
        ...(scope === "student" && values.gradeLevel ? { gradeLevel: values.gradeLevel } : {}),
        ...(scope === "mentor"
          ? {
              expertise: values.expertise
                ? values.expertise.split(",").map((s) => s.trim()).filter(Boolean)
                : undefined,
              currentCompany: values.currentCompany,
            }
          : {}),
      };

      const updated = await updateMyProfile(payload);
      setUser({ ...latest, ...updated });
      toast.success("Profile updated successfully.");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Could not update profile.";
      toast.error(errorMsg);
    }
  };

  const onPasswordSubmit = async (values: PasswordForm) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed successfully.");
      passwordForm.reset();
    } catch {
      toast.error("Could not change password. Check your current password.");
    }
  };

  const dashboardPath = getDashboardPath(scope);
  const profileSaving = profileForm.formState.isSubmitting || (uploadProgress !== null && uploadProgress < 100);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Top Banner Settings Header */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.45)] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.06),transparent_35%)] pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar src={avatarPreview ?? undefined} name={user?.fullName ?? "User"} size="lg" status="online" />
              <div className="overflow-hidden min-w-0">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings</h1>
                <p className="text-xs text-[var(--text-secondary)] truncate font-medium mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="purple" size="sm" className="capitalize">
                    {scope} workspace
                  </Badge>
                  {avatarFile && (
                    <Badge variant="success" size="sm" showDot className="animate-pulse">
                      Pending Avatar Save
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Link to={dashboardPath}>
                <Button variant="outline" className="font-semibold shadow-sm">
                  <LayoutDashboard size={15} /> Dashboard
                </Button>
              </Link>
              <Button variant="secondary" type="button" onClick={handleLogout} className="font-semibold">
                <LogOut size={15} /> Sign out
              </Button>
            </div>
          </div>
          
          {uploadProgress !== null && (
            <div className="mt-5 max-w-md">
              <ProgressBar value={uploadProgress} label="Uploading avatar..." showValueLabel showGlow size="sm" />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Main Grid Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl p-6">
            <CardHeader className="p-0 border-b border-white/5 pb-4 mb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <UserCircle2 size={18} className="text-primary" /> Personal Profile
              </CardTitle>
            </CardHeader>
            
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/3 flex flex-col gap-4">
                <FileInput
                  label="Profile photo"
                  accept="image/*"
                  maxSize={5_000_000}
                  description="PNG or JPG, max 5 MB. Saved when you click Save profile."
                  error={avatarError ?? undefined}
                  onFileSelect={(file) => {
                    if (!file) {
                      handleAvatarPick(null);
                      return;
                    }
                    if (!file.type.startsWith("image/")) {
                      setAvatarError("Please select an image file.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => handleAvatarPick(file, String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
                {avatarFile && (
                  <button
                    type="button"
                    className="text-xs text-danger font-semibold self-start hover:underline ml-1"
                    onClick={() => handleAvatarPick(null)}
                  >
                    Reset selection
                  </button>
                )}
              </div>

              <FormField id="fullName" label="Full name" required error={profileForm.formState.errors.fullName?.message}>
                <Input {...fieldAriaProps("fullName", profileForm.formState.errors.fullName?.message)} {...profileForm.register("fullName")} />
              </FormField>
              
              <FormField id="bio" label="Bio" error={profileForm.formState.errors.bio?.message}>
                <Input {...fieldAriaProps("bio")} placeholder="Tell us about yourself" {...profileForm.register("bio")} />
              </FormField>
              
              <FormField id="phone" label="Phone" error={profileForm.formState.errors.phone?.message}>
                <Input {...fieldAriaProps("phone")} type="tel" autoComplete="tel" placeholder="+251 ..." {...profileForm.register("phone")} />
              </FormField>
              
              {scope === "student" ? (
                <FormField id="gradeLevel" label="Grade level" error={profileForm.formState.errors.gradeLevel?.message}>
                  <Select {...profileForm.register("gradeLevel")} id="gradeLevel">
                    <option value="">Select grade</option>
                    {[8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
              
              {scope === "mentor" ? (
                <>
                  <FormField id="expertise" label="Expertise" description="Comma-separated skills">
                    <Input id="expertise" placeholder="React, Cloud, Python" {...profileForm.register("expertise")} />
                  </FormField>
                  <FormField id="currentCompany" label="Current company border">
                    <Input id="currentCompany" placeholder="EthioTelecom, Google, etc." {...profileForm.register("currentCompany")} />
                  </FormField>
                </>
              ) : null}

              <div className="pt-2">
                <Button type="submit" disabled={profileSaving} className="font-bold shadow-sm">
                  {profileSaving ? "Saving changes…" : "Save profile"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Security Password Card */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border border-white/5 bg-[rgba(16,20,28,0.4)] shadow-xl p-6 h-full flex flex-col justify-between">
            <div>
              <CardHeader className="p-0 border-b border-white/5 pb-4 mb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Security & Password
                </CardTitle>
              </CardHeader>
              
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField id="currentPassword" label="Current password" required>
                  <PasswordInput id="currentPassword" placeholder="••••••••" autoComplete="current-password" {...passwordForm.register("currentPassword")} />
                </FormField>
                
                <FormField id="newPassword" label="New password" required error={passwordForm.formState.errors.newPassword?.message}>
                  <PasswordInput id="newPassword" placeholder="••••••••" autoComplete="new-password" {...passwordForm.register("newPassword")} />
                </FormField>
                
                <FormField id="confirm" label="Confirm password" required error={passwordForm.formState.errors.confirm?.message}>
                  <PasswordInput id="confirm" placeholder="••••••••" autoComplete="new-password" {...passwordForm.register("confirm")} />
                </FormField>

                <div className="pt-4 flex flex-col gap-3">
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting} className="font-bold shadow-sm self-start">
                    Update password
                  </Button>
                  <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors mt-1 self-start">
                    Forgot password?
                  </Link>
                </div>
              </form>
            </div>
            
            <div className="mt-8 p-4 rounded-xl border border-white/5 bg-white/3 flex items-center gap-3">
              <Sparkles size={16} className="text-primary shrink-0 animate-pulse" />
              <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] font-medium">
                Keep passwords unique and secure. Multi-factor checks and OAuth integrations reside under security operations.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

