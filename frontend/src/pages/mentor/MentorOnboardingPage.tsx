import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuthStore } from "@/store/authStore";
import {
  acceptTerms,
  completeOnboarding,
  fetchOnboardingStatus,
  firstLoginChangePassword,
  updateOnboardingStep,
} from "@/services/authService";
import { updateMyProfile, uploadAvatar } from "@/services/userService";
import { api, type ApiResponse } from "@/services/api";

const STEPS = [
  { id: "password", label: "Password" },
  { id: "terms", label: "Terms" },
  { id: "profile", label: "Profile" },
  { id: "photo", label: "Photo" },
  { id: "availability", label: "Availability" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function MentorOnboardingPage() {
  usePageTitle("Mentor Onboarding");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [expertise, setExpertise] = useState(user?.expertise?.join(", ") ?? "");
  const [company, setCompany] = useState(user?.currentCompany ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [error, setError] = useState("");

  const statusQuery = useQuery({
    queryKey: ["mentor", "onboarding-status"],
    queryFn: fetchOnboardingStatus,
  });

  const onboarding = statusQuery.data;

  const activeStep = useMemo((): StepId => {
    if (!onboarding) return "password";
    if (onboarding.mustChangePassword) return "password";
    if (!onboarding.termsAccepted) return "terms";
    if (!onboarding.profileCompleted) return "profile";
    if (!onboarding.photoUploaded) return "photo";
    if (!onboarding.availabilitySet) return "availability";
    return "availability";
  }, [onboarding]);

  useEffect(() => {
    if (onboarding?.onboardingCompleted) {
      navigate("/mentor", { replace: true });
    }
  }, [onboarding?.onboardingCompleted, navigate]);

  const passwordMutation = useMutation({
    mutationFn: () => firstLoginChangePassword(currentPassword, newPassword),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["mentor", "onboarding-status"], data.onboarding);
      setError("");
    },
    onError: () => setError("Could not update password. Check your current password."),
  });

  const termsMutation = useMutation({
    mutationFn: acceptTerms,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["mentor", "onboarding-status"], data.onboarding);
    },
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        bio,
        currentCompany: company,
        expertise: expertise
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["mentor", "onboarding-status"] });
    },
    onError: () => setError("Could not save profile."),
  });

  const photoMutation = useMutation({
    mutationFn: async () => {
      if (!avatarFile) throw new Error("No file");
      return uploadAvatar(avatarFile);
    },
    onSuccess: async (updated) => {
      setUser(updated);
      await updateOnboardingStep("photoUploaded");
      queryClient.invalidateQueries({ queryKey: ["mentor", "onboarding-status"] });
    },
    onError: () => setError("Could not upload photo."),
  });

  const availabilityMutation = useMutation({
    mutationFn: async () => {
      await api.put<ApiResponse<unknown>>("/mentor-availability/me", {
        slots: [{ dayOfWeek, startMinutes: 18 * 60, endMinutes: 20 * 60 }],
      });
      await updateOnboardingStep("availabilitySet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor", "onboarding-status"] });
    },
    onError: () => setError("Could not save availability."),
  });

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      setUser(data.user);
      navigate("/mentor", { replace: true });
    },
    onError: () => setError("Complete all steps before finishing onboarding."),
  });

  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 text-[var(--text-primary)]">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mentor Onboarding</h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Complete these setup steps to activate your mentor console and interactive tools.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((step, index) => {
          const done = index < stepIndex;
          const current = step.id === activeStep;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                current
                  ? "border-violet-500 bg-violet-500/10 text-violet-400"
                  : done
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                    : "border-[#27272A] bg-[#141418] text-zinc-500"
              }`}
            >
              {done ? <CheckCircle2 size={12} /> : null}
              {step.label}
            </div>
          );
        })}
      </div>

      <Card className="space-y-4 border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 rounded-xl shadow-xl">
        {activeStep === "password" && (
          <>
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white">Set Your Permanent Password</h2>
              <p className="text-xs text-zinc-400">Replace your temporary activation password with a secure one.</p>
            </div>
            <FormField id="currentPassword" label="Temporary Password">
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="text-xs bg-[#141418] border-[#27272A] text-white" />
            </FormField>
            <FormField id="newPassword" label="New Password">
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="text-xs bg-[#141418] border-[#27272A] text-white" />
            </FormField>
            <Button
              size="sm"
              className="text-xs font-medium"
              onClick={() => passwordMutation.mutate()}
              disabled={passwordMutation.isPending || !currentPassword || !newPassword}
            >
              Continue to Terms
            </Button>
          </>
        )}

        {activeStep === "terms" && (
          <>
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white">Accept Mentor Terms</h2>
              <p className="text-xs text-zinc-400">Review ethical teaching standards and student safety policies.</p>
            </div>
            <label className="flex items-start gap-2.5 rounded-lg border border-[#27272A] bg-[#141418] p-3 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>I agree to the platform mentor code of conduct, session quality standards, and student safety policies.</span>
            </label>
            <Button size="sm" className="text-xs font-medium" onClick={() => termsMutation.mutate()} disabled={!termsChecked || termsMutation.isPending}>
              Accept and Continue
            </Button>
          </>
        )}

        {activeStep === "profile" && (
          <>
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white">Complete Your Mentor Profile</h2>
              <p className="text-xs text-zinc-400">Let students know about your professional background and areas of expertise.</p>
            </div>
            <FormField id="bio" label="Professional Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[80px] w-full rounded-lg border border-[#27272A] bg-[#141418] p-2.5 text-xs text-white outline-none focus:border-violet-500"
              />
            </FormField>
            <FormField id="company" label="Current Company / Organization">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} className="text-xs bg-[#141418] border-[#27272A] text-white" />
            </FormField>
            <FormField id="expertise" label="Expertise (comma-separated, min 2)">
              <Input value={expertise} onChange={(e) => setExpertise(e.target.value)} className="text-xs bg-[#141418] border-[#27272A] text-white" />
            </FormField>
            <Button size="sm" className="text-xs font-medium" onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
              Save Profile
            </Button>
          </>
        )}

        {activeStep === "photo" && (
          <>
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white">Upload Profile Photo</h2>
              <p className="text-xs text-zinc-400">Add a clear profile picture for students to recognize you.</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#141418] file:text-zinc-200 hover:file:bg-zinc-800"
            />
            <Button size="sm" className="text-xs font-medium" onClick={() => photoMutation.mutate()} disabled={!avatarFile || photoMutation.isPending}>
              Upload Photo
            </Button>
          </>
        )}

        {activeStep === "availability" && (
          <>
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white">Set Teaching Availability</h2>
              <p className="text-xs text-zinc-400">
                Add at least one weekly window. You can refine this later in mentor availability settings.
              </p>
            </div>
            <FormField id="day" label="Day of Week">
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-[#27272A] bg-[#141418] px-2.5 text-xs text-white outline-none"
              >
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                  (day, i) => (
                    <option key={day} value={i}>
                      {day}
                    </option>
                  )
                )}
              </select>
            </FormField>
            <p className="text-[11px] text-zinc-500">Default recurring slot: 6:00 PM – 8:00 PM</p>
            <div className="flex gap-2.5 pt-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => availabilityMutation.mutate()} disabled={availabilityMutation.isPending}>
                Save Availability
              </Button>
              {onboarding?.profileCompleted &&
                onboarding.photoUploaded &&
                onboarding.availabilitySet && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="gap-1.5 text-xs font-medium"
                  >
                    Finish Onboarding <ChevronRight size={13} />
                  </Button>
                )}
            </div>
          </>
        )}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </Card>
    </div>
  );
}
