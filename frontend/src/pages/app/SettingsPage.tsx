import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, Lock, UserCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { logoutApi, changePassword } from "@/services/authService";
import {
  updateMyProfile,
  uploadAvatar,
  getMyProfile,
  getAvatarOptions,
  selectSystemAvatar,
  removeAvatar,
} from "@/services/userService";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress";
import { FormField, fieldAriaProps } from "@/components/ui/form-field";
import { FileInput } from "@/components/ui/file-input";
import { useToast } from "@/components/composites/ToastProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AvatarCropper } from "@/components/ui/avatar-cropper";
import { useAvatarCropper } from "@/hooks/useAvatarCropper";

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
  const { cropperState, openCropper, closeCropper } = useAvatarCropper();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => user?.avatarUrl ?? user?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [avatarOptions, setAvatarOptions] = useState<Awaited<ReturnType<typeof getAvatarOptions>>>([]);
  const [avatarBusy, setAvatarBusy] = useState(false);

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
        setAvatarPreview(profile.avatarUrl ?? profile.avatar ?? null);
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
          setAvatarPreview(user.avatarUrl ?? user.avatar ?? null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const options = await getAvatarOptions();
        if (!cancelled) {
          setAvatarOptions(options);
        }
      } catch {
        if (!cancelled) {
          setAvatarOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentAvatarId = useMemo(
    () => avatarOptions.find((option) => option.url === (avatarPreview ?? user?.avatarUrl ?? user?.avatar))?.id,
    [avatarOptions, avatarPreview, user?.avatar, user?.avatarUrl],
  );

  const handleAvatarPick = (file: File | null) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(user?.avatarUrl ?? user?.avatar ?? null);
      setAvatarError(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 4_000_000) {
      setAvatarError("Image must be smaller than 4 MB.");
      toast.error("Image must be smaller than 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      openCropper(String(reader.result), (croppedFile) => {
        setAvatarFile(croppedFile);
        setAvatarPreview(URL.createObjectURL(croppedFile));
        setAvatarError(null);
      });
    };
    reader.readAsDataURL(file);
  };

  const applyUserAvatar = async (nextUser: Awaited<ReturnType<typeof getMyProfile>>) => {
    setUser(nextUser);
    setAvatarPreview(nextUser.avatarUrl ?? nextUser.avatar ?? null);
    setAvatarFile(null);
    setAvatarError(null);
  };

  const handleSystemAvatarSelect = async (avatarId: string) => {
    try {
      setAvatarBusy(true);
      const updated = await selectSystemAvatar(avatarId);
      await applyUserAvatar(updated);
      toast.success("System avatar selected.");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Could not select avatar.";
      toast.error(errorMsg);
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      setAvatarBusy(true);
      const updated = await removeAvatar();
      await applyUserAvatar(updated);
      toast.success("Avatar reverted to a system avatar.");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Could not reset avatar.";
      toast.error(errorMsg);
    } finally {
      setAvatarBusy(false);
    }
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
        setAvatarFile(null);
        setAvatarPreview(latest.avatarUrl ?? latest.avatar ?? null);
      }

      const payload = {
        fullName: values.fullName,
        bio: values.bio,
        phone: values.phone,
        ...(scope === "student" && values.gradeLevel ? { gradeLevel: values.gradeLevel } : {}),
        ...(scope === "mentor"
          ? {
              expertise: values.expertise
                ? values.expertise
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
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
    } finally {
      setUploadProgress(null);
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

  const profileSaving =
    profileForm.formState.isSubmitting || (uploadProgress !== null && uploadProgress < 100) || avatarBusy;

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 text-[var(--text-primary)]">
        <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Account Settings</h1>
              <p className="mt-0.5 text-xs text-zinc-400">
                Manage your personal profile, avatar, credentials, and notifications.
              </p>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={handleLogout} className="text-xs gap-1.5 text-zinc-300">
              <LogOut size={13} /> Sign Out
            </Button>
          </div>
        </Card>

        {uploadProgress !== null && (
          <div className="max-w-md">
            <ProgressBar value={uploadProgress} label="Uploading avatar..." showValueLabel size="sm" />
          </div>
        )}

        {/* Main Grid Forms */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] shadow-sm p-5 sm:p-6">
              <CardHeader className="p-0 border-b border-[#27272A] pb-3 mb-4">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserCircle2 size={15} className="text-indigo-400" /> Personal Profile
                </CardTitle>
              </CardHeader>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3.5">
                <div className="p-3.5 rounded-lg border border-[#27272A] bg-[#141418] flex flex-col gap-3">
                  <FileInput
                    label="Profile photo"
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={4_000_000}
                    description="JPG, PNG, or WEBP up to 4 MB."
                    error={avatarError ?? undefined}
                    capture="environment"
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
                      reader.onload = () => handleAvatarPick(file);
                      reader.readAsDataURL(file);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAvatarPick(null)}
                      disabled={avatarBusy}
                    >
                      Clear selection
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={avatarBusy}
                    >
                      Revert to system
                    </Button>
                  </div>
                  {avatarFile && (
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Ready to upload: {avatarFile.name}
                    </p>
                  )}
                  {avatarOptions.length ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Choose a default avatar
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {avatarOptions.map((option) => {
                          const selected = currentAvatarId === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleSystemAvatarSelect(option.id)}
                              disabled={avatarBusy}
                              className={cn(
                                "group rounded-2xl border p-3 text-left transition",
                                selected
                                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]"
                                  : "border-[var(--border)] bg-white/3 hover:border-primary/40 hover:bg-primary/5",
                              )}
                            >
                              <Avatar
                                src={option.url}
                                name={option.label}
                                size="lg"
                                className="mx-auto"
                                alt={option.alt}
                              />
                              <p className="mt-2 text-center text-[11px] font-semibold text-white">{option.label}</p>
                              <p className="text-center text-[10px] text-[var(--text-muted)] capitalize">
                                {option.role}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <FormField
                  id="fullName"
                  label="Full name"
                  required
                  error={profileForm.formState.errors.fullName?.message}
                >
                  <Input
                    {...fieldAriaProps("fullName", profileForm.formState.errors.fullName?.message)}
                    {...profileForm.register("fullName")}
                  />
                </FormField>

                <FormField id="bio" label="Bio" error={profileForm.formState.errors.bio?.message}>
                  <Input
                    {...fieldAriaProps("bio")}
                    placeholder="Tell us about yourself"
                    {...profileForm.register("bio")}
                  />
                </FormField>

                <FormField id="phone" label="Phone" error={profileForm.formState.errors.phone?.message}>
                  <Input
                    {...fieldAriaProps("phone")}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+251 ..."
                    {...profileForm.register("phone")}
                  />
                </FormField>

                {scope === "student" ? (
                  <FormField
                    id="gradeLevel"
                    label="Grade level"
                    error={profileForm.formState.errors.gradeLevel?.message}
                  >
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
                    <FormField id="currentCompany" label="Current company">
                      <Input
                        id="currentCompany"
                        placeholder="EthioTelecom, Google, etc."
                        {...profileForm.register("currentCompany")}
                      />
                    </FormField>
                  </>
                ) : null}

                <div className="pt-2">
                  <Button type="submit" size="sm" disabled={profileSaving} className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white">
                    {profileSaving ? "Saving changes…" : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Security Password Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-xl border border-[#27272A] bg-[#0E0E11] shadow-sm p-5 sm:p-6">
              <CardHeader className="p-0 border-b border-[#27272A] pb-3 mb-4">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lock size={15} className="text-indigo-400" /> Security & Password
                </CardTitle>
              </CardHeader>

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3.5">
                <FormField id="currentPassword" label="Current password" required>
                  <PasswordInput
                    id="currentPassword"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...passwordForm.register("currentPassword")}
                    className="bg-[#141418] border-[#27272A] text-xs h-9 text-white"
                  />
                </FormField>

                <FormField
                  id="newPassword"
                  label="New password"
                  required
                  error={passwordForm.formState.errors.newPassword?.message}
                >
                  <PasswordInput
                    id="newPassword"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                    className="bg-[#141418] border-[#27272A] text-xs h-9 text-white"
                  />
                </FormField>

                <FormField
                  id="confirm"
                  label="Confirm password"
                  required
                  error={passwordForm.formState.errors.confirm?.message}
                >
                  <PasswordInput
                    id="confirm"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...passwordForm.register("confirm")}
                    className="bg-[#141418] border-[#27272A] text-xs h-9 text-white"
                  />
                </FormField>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={passwordForm.formState.isSubmitting}
                    className="text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white self-start"
                  >
                    {passwordForm.formState.isSubmitting ? "Updating…" : "Update Password"}
                  </Button>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-indigo-400 hover:underline self-start mt-0.5"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </motion.div>
      {cropperState.open && (
        <AvatarCropper
          src={cropperState.src}
          onComplete={cropperState.onComplete}
          onCancel={closeCropper}
          aspect={1}
          minWidth={128}
        />
      )}
    </>
  );
}
