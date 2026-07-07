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
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Mentor onboarding</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Complete these steps to unlock mentor tools and start teaching.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, index) => {
          const done = index < stepIndex;
          const current = step.id === activeStep;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                current
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-success/30 text-success"
                    : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : null}
              {step.label}
            </div>
          );
        })}
      </div>

      <Card className="space-y-5 border-[var(--border)] bg-[var(--bg-card)] p-6">
        {activeStep === "password" && (
          <>
            <h2 className="text-lg font-semibold text-white">Set your password</h2>
            <FormField id="currentPassword" label="Current / temporary password">
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </FormField>
            <FormField id="newPassword" label="New password">
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </FormField>
            <Button
              onClick={() => passwordMutation.mutate()}
              disabled={passwordMutation.isPending || !currentPassword || !newPassword}
            >
              Continue
            </Button>
          </>
        )}

        {activeStep === "terms" && (
          <>
            <h2 className="text-lg font-semibold text-white">Accept mentor terms</h2>
            <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-1"
              />
              I agree to the platform mentor code of conduct, session quality standards, and student safety policies.
            </label>
            <Button onClick={() => termsMutation.mutate()} disabled={!termsChecked || termsMutation.isPending}>
              Accept and continue
            </Button>
          </>
        )}

        {activeStep === "profile" && (
          <>
            <h2 className="text-lg font-semibold text-white">Complete your profile</h2>
            <FormField id="bio" label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none focus:border-primary"
              />
            </FormField>
            <FormField id="company" label="Current company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </FormField>
            <FormField id="expertise" label="Expertise (comma-separated, min 2)">
              <Input value={expertise} onChange={(e) => setExpertise(e.target.value)} />
            </FormField>
            <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
              Save profile
            </Button>
          </>
        )}

        {activeStep === "photo" && (
          <>
            <h2 className="text-lg font-semibold text-white">Upload a profile photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="text-sm text-[var(--text-secondary)]"
            />
            <Button onClick={() => photoMutation.mutate()} disabled={!avatarFile || photoMutation.isPending}>
              Upload photo
            </Button>
          </>
        )}

        {activeStep === "availability" && (
          <>
            <h2 className="text-lg font-semibold text-white">Set teaching availability</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Add at least one weekly window. You can refine this later in mentor settings.
            </p>
            <FormField id="day" label="Day of week">
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm outline-none"
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
            <p className="text-xs text-[var(--text-muted)]">Default slot: 6:00 PM – 8:00 PM</p>
            <div className="flex gap-3">
              <Button onClick={() => availabilityMutation.mutate()} disabled={availabilityMutation.isPending}>
                Save availability
              </Button>
              {onboarding?.profileCompleted &&
                onboarding.photoUploaded &&
                onboarding.availabilitySet && (
                  <Button
                    variant="primary"
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="gap-2"
                  >
                    Finish onboarding <ChevronRight size={16} />
                  </Button>
                )}
            </div>
          </>
        )}

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Card>
    </div>
  );
}
