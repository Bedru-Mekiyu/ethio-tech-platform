import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Loader2, ShieldCheck, Upload, User, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { MentorOnboardingStepper, type OnboardingStepItem } from "@/components/mentor/MentorOnboardingStepper";
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

const STEPS: readonly OnboardingStepItem[] = [
  { id: "password", label: "Password", shortLabel: "Password" },
  { id: "terms", label: "Code of Conduct", shortLabel: "Terms" },
  { id: "profile", label: "Profile Details", shortLabel: "Profile" },
  { id: "photo", label: "Photo Upload", shortLabel: "Photo" },
  { id: "availability", label: "Weekly Schedule", shortLabel: "Schedule" },
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [error, setError] = useState("");

  const statusQuery = useQuery({
    queryKey: ["mentor", "onboarding-status"],
    queryFn: fetchOnboardingStatus,
    enabled: !!user,
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

  const handleAvatarSelect = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const passwordMutation = useMutation({
    mutationFn: () => firstLoginChangePassword(currentPassword, newPassword),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["mentor", "onboarding-status"], data.onboarding);
      setError("");
    },
    onError: () => setError("Could not update password. Please verify your current temporary password."),
  });

  const termsMutation = useMutation({
    mutationFn: acceptTerms,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["mentor", "onboarding-status"], data.onboarding);
      setError("");
    },
    onError: () => setError("Could not record terms acceptance. Please try again."),
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
      setError("");
    },
    onError: () => setError("Could not save profile details. Please try again."),
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
      setError("");
    },
    onError: () => setError("Could not upload photo. Please ensure it is an image under 5MB."),
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
      setError("");
    },
    onError: () => setError("Could not save availability window. Please try again."),
  });

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      setUser(data.user);
      navigate("/mentor", { replace: true });
    },
    onError: () => setError("Please complete all required onboarding steps before proceeding to the console."),
  });

  const parsedSkills = useMemo(() => {
    return expertise
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [expertise]);

  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6 text-slate-900 dark:text-slate-100">
      {/* ─── Header & Progress ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck size={13} />
            <span>Mentor Console Activation</span>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mentor Onboarding
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Complete your account setup to activate the mentor dashboard, project review queue, and classroom tools.
        </p>
      </div>

      {/* ─── Stepper ─── */}
      <MentorOnboardingStepper steps={STEPS} activeStepId={activeStep} />

      {/* ─── Main Step Card ─── */}
      <Card className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Step 1: Password */}
        {activeStep === "password" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Set Your Permanent Password
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Replace your temporary activation password with a secure one.
              </p>
            </div>

            <div className="space-y-4">
              <FormField id="currentPassword" label="Temporary Password" required>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  autoComplete="current-password"
                />
              </FormField>

              <FormField
                id="newPassword"
                label="New Permanent Password"
                required
                description="Must be at least 8 characters with letters and numbers."
              >
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create strong password"
                  autoComplete="new-password"
                />
              </FormField>
            </div>

            <div className="pt-2">
              <Button
                size="md"
                className="w-full sm:w-auto font-semibold shadow-xs"
                onClick={() => passwordMutation.mutate()}
                disabled={passwordMutation.isPending || !currentPassword || !newPassword}
              >
                {passwordMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    Continue to Code of Conduct
                    <ChevronRight size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Terms & Conduct */}
        {activeStep === "terms" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Accept Mentor Terms</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Review ethical teaching standards and student safety policies.
              </p>
            </div>

            {/* Ethical Standards Box */}
            <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-3 text-xs">
              <p className="font-semibold text-slate-900 dark:text-white text-xs">
                Mentor Ethical Standards & Expectations:
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5">•</span>
                  <span>
                    <strong>Constructive Code Reviews:</strong> Provide actionable, respectful feedback on student PRs,
                    focusing on architectural growth and clean code practices.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5">•</span>
                  <span>
                    <strong>Scheduled Punctuality:</strong> Honor confirmed 1-on-1 office hours and notify platform administrators
                    at least 24 hours in advance if a conflict arises.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5">•</span>
                  <span>
                    <strong>Safe & Inclusive Environment:</strong> Maintain a professional, zero-harassment environment
                    adhering to platform student safety guidelines.
                  </span>
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-slate-900 dark:focus:ring-white"
              />
              <span className="leading-relaxed">
                I agree to the platform mentor code of conduct, session quality standards, and student safety policies.
              </span>
            </label>

            <div className="pt-2">
              <Button
                size="md"
                className="w-full sm:w-auto font-semibold shadow-xs"
                onClick={() => termsMutation.mutate()}
                disabled={!termsChecked || termsMutation.isPending}
              >
                {termsMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Recording Agreement...
                  </>
                ) : (
                  <>
                    Accept and Continue
                    <ChevronRight size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Profile */}
        {activeStep === "profile" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Complete Your Mentor Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Let students know about your professional background and areas of expertise.
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                id="bio"
                label="Professional Bio"
                description="A concise summary of your engineering background, core technologies, and mentoring focus."
              >
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer with 7+ years architecting microservices and mentoring aspiring engineers in Go and Kubernetes..."
                  rows={3}
                  className="min-h-[100px]"
                />
              </FormField>

              <FormField id="company" label="Current Company / Organization">
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Distributed Tech Lab / FinTech Startup"
                />
              </FormField>

              <FormField
                id="expertise"
                label="Expertise (comma-separated, min 2)"
                description="Comma-separated technologies or domains you are eager to teach."
              >
                <Input
                  id="expertise"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="e.g. Go, Kubernetes, System Design, PostgreSQL"
                />
              </FormField>

              {parsedSkills.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Parsed Skills Preview:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <Check size={10} className="text-slate-600 dark:text-slate-400" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                size="md"
                className="w-full sm:w-auto font-semibold shadow-xs"
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    Save Profile & Continue
                    <ChevronRight size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Photo */}
        {activeStep === "photo" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Upload Profile Photo</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Add a clear profile picture for students to recognize you during video sessions and office hours.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/[0.01]">
              {/* Avatar Preview */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full border-2 border-slate-200 dark:border-white/20 overflow-hidden bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center shadow-xs">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User size={36} className="text-slate-400" />
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Upload size={15} />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarSelect(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {avatarFile ? avatarFile.name : "JPEG, PNG, or WebP. Max file size: 5MB."}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                size="md"
                className="w-full sm:w-auto font-semibold shadow-xs"
                onClick={() => photoMutation.mutate()}
                disabled={!avatarFile || photoMutation.isPending}
              >
                {photoMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Uploading Photo...
                  </>
                ) : (
                  <>
                    Upload Photo & Continue
                    <ChevronRight size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Availability */}
        {activeStep === "availability" && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Set Weekly Availability
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Add at least one weekly window. You can refine this later in mentor availability settings.
              </p>
            </div>

            <div className="space-y-4">
              <FormField id="day" label="Day of Week" description="Preferred day for recurring student office hours.">
                <select
                  id="day"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="h-10 sm:h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition-[border-color,box-shadow] focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:focus:border-white dark:focus:ring-white"
                >
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                    <option key={day} value={i} className="dark:bg-slate-950">
                      {day}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 flex items-center gap-3">
                <Clock size={16} className="text-slate-600 dark:text-slate-400 shrink-0" />
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Default recurring slot: <strong>6:00 PM – 8:00 PM (EAT)</strong>. Additional custom time slots can be
                  configured anytime in your Mentor Dashboard settings.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button
                size="md"
                variant="outline"
                className="font-semibold shadow-xs"
                onClick={() => availabilityMutation.mutate()}
                disabled={availabilityMutation.isPending}
              >
                {availabilityMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Availability"
                )}
              </Button>

              {onboarding?.profileCompleted && onboarding.photoUploaded && onboarding.availabilitySet && (
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="gap-1.5 font-semibold shadow-xs"
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      Complete Onboarding & Go to Dashboard
                      <ChevronRight size={14} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
            role="alert"
          >
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p>{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
