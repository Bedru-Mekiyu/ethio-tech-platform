import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  GraduationCap,
  Laptop2,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { QueryError } from "@/components/composites/QueryError";
import {
  fetchMarketingMentors,
  submitMentorApplication,
  type MarketingMentorPageData,
  type MentorApplicationPayload,
} from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const skillOptions = [
  "Web Development",
  "Frontend",
  "Backend",
  "AI / ML",
  "Cybersecurity",
  "Mobile",
  "Design Systems",
  "DevOps",
];

const mentoringStyles = [
  { value: "live-sessions", label: "Live sessions" },
  { value: "project-reviews", label: "Project reviews" },
  { value: "office-hours", label: "Office hours" },
  { value: "cohort-support", label: "Cohort support" },
] as const;

const availabilityOptions = [
  { value: "weeknights", label: "Weeknights" },
  { value: "weekends", label: "Weekends" },
  { value: "flexible", label: "Flexible" },
  { value: "ad-hoc", label: "Ad hoc" },
] as const;

function MentorApplySkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <Card className="h-[520px] rounded-[28px]" />
        <Card className="h-[520px] rounded-[28px]" />
      </div>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 border-[var(--border)] bg-[var(--bg-card)]/90 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </Card>
  );
}

export function MentorRecruitmentPage() {
  const reduceMotion = useReducedMotion();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [whyMentor, setWhyMentor] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertise, setExpertise] = useState<string[]>(["Web Development", "Frontend"]);
  const [mentoringStyle, setMentoringStyle] = useState<Array<MentorApplicationPayload["mentoringStyle"][number]>>([
    "live-sessions",
    "project-reviews",
  ]);
  const [availability, setAvailability] = useState<MentorApplicationPayload["availability"]>("flexible");
  const [consent, setConsent] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<MarketingMentorPageData>({
    queryKey: ["marketing", "mentor-application", "context"],
    queryFn: fetchMarketingMentors,
  });

  const mutation = useMutation({
    mutationFn: submitMentorApplication,
  });

  const stats = useMemo(
    () => [
      { label: "Mentor network", value: data?.stats.totalMentors ?? 0, icon: Users },
      { label: "Verified mentors", value: data?.stats.verifiedMentors ?? 0, icon: BadgeCheck },
      { label: "Live sessions", value: data?.stats.totalSessions ?? 0, icon: CalendarDays },
    ],
    [data]
  );

  const toggleSkill = (skill: string) => {
    setExpertise((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]
    );
  };

  const toggleStyle = (style: MentorApplicationPayload["mentoringStyle"][number]) => {
    setMentoringStyle((current) =>
      current.includes(style) ? current.filter((item) => item !== style) : [...current, style]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError("");
    const parsedYearsExperience = Number(yearsExperience);
    const extraSkills = expertiseInput
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const normalizedExpertise = Array.from(new Set([...expertise, ...extraSkills]));

    if (normalizedExpertise.length < 2) {
      setSubmissionError("Please include at least 2 expertise areas.");
      return;
    }
    if (mentoringStyle.length < 1) {
      setSubmissionError("Please choose at least one mentoring style.");
      return;
    }
    if (whyMentor.trim().length < 20) {
      setSubmissionError("Tell us more about your motivation (minimum 20 characters).");
      return;
    }
    if (!consent) {
      setSubmissionError("Please confirm consent before submitting your application.");
      return;
    }

    await mutation.mutateAsync({
      fullName,
      email,
      currentRole,
      currentCompany: currentCompany || undefined,
      location: location || undefined,
      yearsExperience:
        yearsExperience && !Number.isNaN(parsedYearsExperience)
          ? parsedYearsExperience
          : undefined,
      expertise: normalizedExpertise,
      availability,
      mentoringStyle,
      whyMentor,
      linkedin: linkedin || undefined,
      portfolio: portfolio || undefined,
      consent,
    });
  };

  if (isLoading) {
    return <MentorApplySkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load mentor application right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <motion.section
        className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="space-y-6">
          <div>
            <Badge className="mb-5">Mentor application</Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Apply to become a <span className="glow-text">Mentor</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
              Share your background, teaching style, and availability so we can match you with learners who
              need practical guidance, not just more content.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <MetricPill
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={new Intl.NumberFormat("en", { notation: "compact" }).format(stat.value)}
              />
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-4">
              <Badge variant="purple">01</Badge>
              <h2 className="mt-3 font-semibold text-white">Professional information</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                We use your role and company to understand the perspective you bring to learners.
              </p>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-4">
              <Badge variant="purple">02</Badge>
              <h2 className="mt-3 font-semibold text-white">Expertise & style</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Choose the topics and mentoring formats that match your strengths.
              </p>
            </Card>
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-4">
              <Badge variant="purple">03</Badge>
              <h2 className="mt-3 font-semibold text-white">Review process</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Submissions are reviewed by the team and routed to moderation for onboarding.
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(180deg,rgba(9,14,24,0.98),rgba(6,9,18,0.98))] p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-primary" size={18} />
                  <p className="font-medium text-white">Clear expectations</p>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Mentor sessions should be practical, respectful, and learner-focused.
                </p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Laptop2 className="text-secondary" size={18} />
                  <p className="font-medium text-white">Works across devices</p>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  The application is mobile-friendly and safe to complete on low-bandwidth connections.
                </p>
              </Card>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {mutation.isSuccess ? (
            <Card className="border-success/25 bg-success/10 p-6">
              <Badge variant="success">Application received</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-white">Thanks, {fullName || "mentor"}.</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Your application is now queued for review with status <strong>pending</strong>. We&apos;ll follow up
                after moderation checks your profile.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/mentors">
                  <Button variant="outline">Browse mentors</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary">
                    Talk to the team
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge>Application form</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Tell us about your mentoring profile</h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    This form starts a mentor application. It does not create a mentor account.
                  </p>
                </div>
                <Badge variant="purple">Public application</Badge>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label required>Full name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Amina Tesfaye" />
                  </div>
                  <div>
                    <Label required>Email address</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="amina@example.com" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label required>Current role</Label>
                    <Input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} required placeholder="Senior Frontend Engineer" />
                  </div>
                  <div>
                    <Label>Current company</Label>
                    <Input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} placeholder="EthioTech Labs" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Location</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Addis Ababa, Ethiopia" />
                  </div>
                  <div>
                    <Label>Years of experience</Label>
                    <Input
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      type="number"
                      min={0}
                      max={60}
                      placeholder="8"
                    />
                  </div>
                </div>

                <div>
                  <Label>Areas of expertise</Label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((skill) => {
                      const active = expertise.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            active
                              ? "border-primary bg-primary text-[var(--bg-base)]"
                              : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">Add any extra skills separated by commas below.</p>
                  <Input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="React, Node.js, MongoDB"
                    className="mt-3"
                  />
                </div>

                <div>
                  <Label>Mentoring style</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {mentoringStyles.map((style) => {
                      const active = mentoringStyle.includes(style.value);
                      return (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => toggleStyle(style.value)}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            active
                              ? "border-secondary bg-secondary/15 text-white"
                              : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                          }`}
                        >
                          <span className="text-sm font-medium">{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Weekly availability</Label>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {availabilityOptions.map((option) => {
                      const active = availability === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAvailability(option.value)}
                          className={`rounded-xl border px-4 py-3 text-sm transition ${
                            active
                              ? "border-primary bg-primary/15 text-white"
                              : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Why do you want to mentor?</Label>
                  <Textarea
                    value={whyMentor}
                    onChange={(e) => setWhyMentor(e.target.value)}
                    required
                    placeholder="Share what drives you to mentor and how you want to support learners."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>LinkedIn profile</Label>
                    <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} type="url" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <Label>Portfolio or website</Label>
                    <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} type="url" placeholder="https://..." />
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white/5 p-4 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-elevated)] text-primary"
                  />
                  <span>
                    I confirm this information is accurate and I agree to be contacted about mentor onboarding.
                  </span>
                </label>

                {submissionError ? (
                <p className="text-sm text-danger" role="alert">
                   {submissionError}
                </p>
                ) : null}

                {mutation.isError ? (
                <p className="text-sm text-danger" role="alert">
                   {(mutation.error as Error)?.message || "Unable to submit the application."}
                </p>
                ) : null}

                <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending || !consent}>
                {mutation.isPending ? "Submitting..." : "Apply to become a mentor"}
                <ArrowRight size={16} className="ml-2" />
                </Button>
              </form>
            </Card>
          )}

          <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="text-primary" size={18} />
              <h3 className="font-semibold text-white">What happens next</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 text-secondary" size={16} />
                <p className="text-sm text-[var(--text-secondary)]">We review each application and check for role fit.</p>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 text-secondary" size={16} />
                <p className="text-sm text-[var(--text-secondary)]">Approved mentors get onboarding guidance and dashboard access.</p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 text-secondary" size={16} />
                <p className="text-sm text-[var(--text-secondary)]">You can then run sessions, review projects, and support cohorts.</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.section>
    </div>
  );
}
