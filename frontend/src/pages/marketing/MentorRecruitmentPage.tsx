import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Code2,
  Cpu,
  Loader2,
  Rocket,
  ShieldCheck,
  Trophy,
  Users,
  Video,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { submitMentorApplication, type MentorApplicationPayload } from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const skillOptions = [
  "Frontend (React / TypeScript)",
  "Backend & Distributed Systems (Go / Node)",
  "AI & Machine Learning (PyTorch / NLP)",
  "Cloud & DevOps (AWS / Kubernetes)",
  "Cybersecurity & DevSecOps",
  "Mobile (Flutter / React Native)",
  "Product & UI/UX Design",
  "Systems Engineering (Rust / C++)",
  "Database & Data Engineering",
  "Fintech & Payment Systems",
];

const mentoringStyles = [
  {
    value: "live-sessions",
    label: "Live 1-on-1 Office Hours",
    desc: "Weekly scheduled video mentoring & bug triage",
  },
  {
    value: "project-reviews",
    label: "Async Code & PR Reviews",
    desc: "Review student GitHub submissions at your own pace",
  },
  {
    value: "office-hours",
    label: "Group Cohort Masterclasses",
    desc: "Lead quarterly 60-minute technical deep dives",
  },
  {
    value: "cohort-support",
    label: "Capstone Defense Panel",
    desc: "Evaluate and grade graduating student architectures",
  },
] as const;

const availabilityOptions = [
  { value: "weeknights", label: "Weeknights (2-4 hrs/wk)" },
  { value: "weekends", label: "Weekends (2-4 hrs/wk)" },
  { value: "flexible", label: "Flexible Async (2 hrs/wk)" },
  { value: "ad-hoc", label: "Ad-hoc Monthly (1-2 hrs)" },
] as const;

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Quick Application",
    description: "Submit your professional background, technical specialties, and preferred mentoring schedule.",
    icon: Code2,
  },
  {
    step: "02",
    title: "Alignment Chat",
    description: "Connect briefly with a Guild Coordinator to review curriculum tracks and student expectations.",
    icon: Video,
  },
  {
    step: "03",
    title: "Guild Onboarding",
    description: "Receive access to the mentor dashboard, LiveKit video rooms, and automated GitHub review queues.",
    icon: ShieldCheck,
  },
  {
    step: "04",
    title: "Cohort Pairing",
    description: "Get matched with motivated learners whose project goals align directly with your technical stack.",
    icon: Rocket,
  },
];

const MENTOR_BENEFITS = [
  {
    icon: Award,
    title: "Leadership & Coaching Credentials",
    description:
      "Earn verified digital mentor credentials and leadership endorsements for your LinkedIn profile and resume.",
  },
  {
    icon: Users,
    title: "Direct Talent Scouting",
    description:
      "Get first-look access to top-performing student engineers for your company's hiring pipeline and internships.",
  },
  {
    icon: Cpu,
    title: "Engineering Leadership Network",
    description:
      "Connect with fellow engineering leads, participate in technical roundtables, and share best practices.",
  },
  {
    icon: Trophy,
    title: "Stipends & Impact Recognition",
    description: "Optional honorariums for high-frequency mentors and public recognition in our mentor directory.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Mentoring with EthioTech is the most rewarding 2 hours of my week. Reviewing code written by brilliant students reminds me why I fell in love with software engineering.",
    author: "Dawit Abebe",
    role: "Principal Systems Architect",
    company: "Enterprise Cloud Systems",
  },
  {
    quote:
      "We hired two junior developers directly from the cohort I mentored. They were already accustomed to PR reviews, git branching, and writing comprehensive unit tests.",
    author: "Bethlehem Tadesse",
    role: "Engineering Manager",
    company: "Fintech Startup Leader",
  },
];

function FieldLabel({
  children,
  htmlFor,
  required,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100"
      >
        {children}
        {required && (
          <span className="ml-1 text-[11px] font-normal text-slate-600 dark:text-slate-400" aria-hidden="true">
            (Required)
          </span>
        )}
      </label>
      {hint && <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{hint}</span>}
    </div>
  );
}

export function MentorRecruitmentPage() {
  const reduceMotion = useReducedMotion();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("3");
  const [whyMentor, setWhyMentor] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([
    "Frontend (React / TypeScript)",
    "Backend & Distributed Systems (Go / Node)",
  ]);
  const [mentoringStyle, setMentoringStyle] = useState<Array<MentorApplicationPayload["mentoringStyle"][number]>>([
    "live-sessions",
    "project-reviews",
  ]);
  const [availability, setAvailability] = useState<MentorApplicationPayload["availability"]>("flexible");
  const [consent, setConsent] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const mutation = useMutation({
    mutationFn: submitMentorApplication,
  });

  const toggleSkill = (skill: string) => {
    setExpertise((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    );
  };

  const toggleStyle = (style: MentorApplicationPayload["mentoringStyle"][number]) => {
    setMentoringStyle((current) =>
      current.includes(style) ? current.filter((item) => item !== style) : [...current, style],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionError("");
    const parsedYearsExperience = Number(yearsExperience);

    if (parsedYearsExperience < 2) {
      setSubmissionError("Mentorship requires at least 2 years of professional industry experience.");
      return;
    }

    if (expertise.length < 1) {
      setSubmissionError("Please select at least 1 technical domain of expertise.");
      return;
    }
    if (mentoringStyle.length < 1) {
      setSubmissionError("Please select at least one preferred mentoring format.");
      return;
    }
    if (whyMentor.trim().length < 15) {
      setSubmissionError("Please share a brief motivation (minimum 15 characters).");
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
      yearsExperience: yearsExperience && !Number.isNaN(parsedYearsExperience) ? parsedYearsExperience : 2,
      expertise,
      availability,
      mentoringStyle,
      whyMentor,
      linkedin: linkedin || undefined,
      portfolio: portfolio || undefined,
      consent,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 lg:py-16 lg:px-8 space-y-16 text-slate-900 dark:text-slate-100">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-5"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] break-words">
          Mentor Emerging <span className="text-primary">Software Engineers</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
          Support developers as they build production software through weekly code reviews, system design discussions,
          and project evaluations.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
          <a href="#mentor-form" className="w-full sm:w-auto">
            <Button size="md" className="w-full sm:w-auto font-semibold shadow-xs">
              Apply to Mentor
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </a>
          <a href="#onboarding-process" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto font-semibold shadow-xs">
              View Onboarding Steps
            </Button>
          </a>
        </div>

        {/* Enhanced Trust Signals */}
        <div className="pt-3 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-slate-700 dark:text-slate-300" />
            <span>Identity Verified via Professional Profile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-slate-700 dark:text-slate-300" />
            <span>Structured Review & Verification Process</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-700 dark:text-slate-300" />
            <span>Connect with Experienced Technical Leads</span>
          </div>
        </div>

        {/* Requirements Strip */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 sm:p-4 max-w-3xl mx-auto mt-6 flex flex-wrap items-center justify-around gap-3 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <ShieldCheck size={14} className="text-slate-700 dark:text-slate-300" />
            Requirement: 2+ Years Senior Experience
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <Clock size={14} className="text-slate-700 dark:text-slate-300" />
            Flexible Commitment: 2–4 Hours / Week
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <Award size={14} className="text-slate-700 dark:text-slate-300" />
            Verified Leadership Credential
          </span>
        </div>
      </motion.section>

      {/* ─── Guild Value Proposition ─── */}
      <section className="space-y-6">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            High Impact. Zero Friction Mentoring.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            We handle curriculum design, squad coordination, and student vetting so you can focus entirely on
            high-signal coaching.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENTOR_BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 transition-all hover:border-slate-300 dark:hover:border-white/20 shadow-2xs"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 dark:text-white text-sm">{benefit.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── 4-Step Frictionless Onboarding Process ─── */}
      <section id="onboarding-process" className="space-y-6 scroll-mt-20">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            The 4-Step Mentor Onboarding Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            We value your time. Our onboarding is designed to get you matched and coaching with minimal administrative
            overhead.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ONBOARDING_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.step}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-white/20"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 dark:text-white text-sm">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Interactive Application Form & Guidelines ─── */}
      <section id="mentor-form" className="scroll-mt-20">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-8 lg:p-10 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            {/* Left: Expectations & Guidelines */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Join the Guild
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Tell us about your professional background, technical strengths, and preferred mentoring schedule.
                  Applications are reviewed by the Guild Admissions Committee within 2–3 business days.
                </p>
              </div>

              {/* Stats Summary */}
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock3 size={14} className="text-slate-700 dark:text-slate-300" /> Flexible Weekly Commitment
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Allocate 2 to 4 hours per week for asynchronous PR reviews or weekend 1-on-1 office hours.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Award size={14} className="text-slate-700 dark:text-slate-300" /> Senior Experience Requirement
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Minimum 2+ years of professional industry experience in engineering, product, or data.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Trophy size={14} className="text-slate-700 dark:text-slate-300" /> Tooling & Platform Provided
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Access to built-in LiveKit video rooms, automated code review dashboards, and calendar booking.
                  </p>
                </div>

                {/* Live Mentor Guild Credibility Quote */}
                <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4 space-y-2">
                  <p className="text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed">
                    &ldquo;Reviewing PRs from students in Jimma and Bahir Dar is the most impactful engineering service
                    I do all week.&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-white/10">
                    <span className="font-bold text-slate-900 dark:text-white">Selamawit T.</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">Staff SRE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Application Form */}
            <div>
              {mutation.isSuccess ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 p-6 sm:p-8 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <Badge variant="secondary">Application Received</Badge>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-2">
                      Thank you, {fullName || "Fellow Engineer"}!
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Your mentor application has been securely submitted to the Guild Admissions Committee. We will
                      review your background and follow up at{" "}
                      <strong className="text-slate-900 dark:text-white font-semibold">{email}</strong> within 48
                      business hours.
                    </p>
                  </div>

                  {/* Review Roadmap */}
                  <div className="max-w-md mx-auto rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-4 text-left space-y-2 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">What Happens Next:</p>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        <span>1. Initial application screening (24–48 hours)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        <span>2. 15-minute introductory alignment with a Guild Lead</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        <span>3. Account activation email with permanent onboarding link</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <Link to="/mentors">
                      <Button variant="secondary" size="sm" className="font-semibold shadow-xs">
                        Browse Mentor Directory
                      </Button>
                    </Link>
                    <Link to="/about">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                      >
                        Learn About EthioTech
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Name and Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="fullName" required>
                        Full Name
                      </FieldLabel>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        aria-required="true"
                        placeholder="e.g. Dawit Abebe"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="email" required>
                        Email Address
                      </FieldLabel>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        aria-required="true"
                        placeholder="e.g. dawit@example.com"
                      />
                    </div>
                  </div>

                  {/* Role and Company */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="currentRole" required>
                        Current Professional Role
                      </FieldLabel>
                      <Input
                        id="currentRole"
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        required
                        aria-required="true"
                        placeholder="e.g. Senior Software Architect"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="currentCompany">Current Company / Organization</FieldLabel>
                      <Input
                        id="currentCompany"
                        value={currentCompany}
                        onChange={(e) => setCurrentCompany(e.target.value)}
                        placeholder="e.g. Technology Firm / Startup"
                      />
                    </div>
                  </div>

                  {/* Experience and Location */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="yearsExperience" required hint="Min. 2 years">
                        Years of Professional Experience
                      </FieldLabel>
                      <Input
                        id="yearsExperience"
                        type="number"
                        min={2}
                        max={50}
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        required
                        aria-required="true"
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="location">Location / City</FieldLabel>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Addis Ababa / Seattle / Berlin"
                      />
                    </div>
                  </div>

                  {/* Technical Expertise Domains */}
                  <div className="space-y-2">
                    <FieldLabel required hint="Select 1 or more">
                      Primary Technical Domains
                    </FieldLabel>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Technical Domains">
                      {skillOptions.map((skill) => {
                        const active = expertise.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            aria-pressed={active}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold dark:border-white dark:bg-white dark:text-slate-950"
                                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {active ? <Check size={12} strokeWidth={2.5} /> : null}
                            <span>{skill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mentoring Format Preferences */}
                  <div className="space-y-2">
                    <FieldLabel required hint="Select formats that fit your schedule">
                      Preferred Mentoring Formats
                    </FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Mentoring Formats">
                      {mentoringStyles.map((style) => {
                        const active = mentoringStyle.includes(style.value);
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => toggleStyle(style.value)}
                            aria-pressed={active}
                            className={`rounded-xl border p-3.5 text-left transition-all duration-150 ${
                              active
                                ? "border-slate-900 bg-slate-50 dark:bg-white/[0.05] dark:border-white text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-900 dark:ring-white"
                                : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{style.label}</p>
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  active
                                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                                    : "border-slate-300 dark:border-white/20"
                                }`}
                              >
                                {active && <Check size={10} strokeWidth={3} />}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                              {style.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekly Availability */}
                  <div className="space-y-2">
                    <FieldLabel required>Weekly Time Availability</FieldLabel>
                    <div
                      className="grid gap-2 grid-cols-2 sm:grid-cols-4"
                      role="radiogroup"
                      aria-label="Weekly Availability"
                    >
                      {availabilityOptions.map((opt) => {
                        const active = availability === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAvailability(opt.value)}
                            className={`rounded-lg border p-2 text-center text-xs font-medium transition-all duration-150 ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold dark:border-white dark:bg-white dark:text-slate-950"
                                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <FieldLabel htmlFor="whyMentor" required hint={`${whyMentor.trim().length} / 15 chars min`}>
                      Why do you want to mentor with EthioTech?
                    </FieldLabel>
                    <Textarea
                      id="whyMentor"
                      value={whyMentor}
                      onChange={(e) => setWhyMentor(e.target.value)}
                      required
                      aria-required="true"
                      placeholder="Share your motivation for coaching Ethiopian junior engineers, your background, and how you hope to contribute."
                      rows={3}
                      className="min-h-[96px]"
                    />
                  </div>

                  {/* LinkedIn and Portfolio */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="linkedin">LinkedIn Profile URL</FieldLabel>
                      <Input
                        id="linkedin"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="portfolio">GitHub / Portfolio URL</FieldLabel>
                      <Input
                        id="portfolio"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        type="url"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                      aria-required="true"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-slate-900 dark:focus:ring-white"
                    />
                    <span className="leading-relaxed">
                      I confirm that I have 2+ years of professional industry experience and commit to providing
                      respectful, constructive guidance to learners.
                    </span>
                  </label>

                  {/* Error Messaging */}
                  {submissionError && (
                    <div
                      className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
                      role="alert"
                    >
                      <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                      <p>{submissionError}</p>
                    </div>
                  )}

                  {mutation.isError && (
                    <div
                      className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400"
                      role="alert"
                    >
                      <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                      <p>
                        {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                          (mutation.error as Error)?.message ||
                          "Unable to submit mentor application. Please verify your details and try again."}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="md"
                    className="w-full font-semibold shadow-xs"
                    disabled={mutation.isPending || !consent}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Mentor Application
                        <ArrowRight size={14} className="ml-1.5" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Testimonials from Active Mentors ─── */}
      <section className="space-y-6">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hear From Our Active Senior Mentors
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TESTIMONIALS.map((t, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-all"
            >
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-white/10">
                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{t.author}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{t.role}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-10 text-center space-y-4 shadow-2xs">
        <div className="mx-auto max-w-2xl space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Questions About Mentoring?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            Reach out directly to our Guild Admissions Coordinator for questions regarding scheduling, honorariums, or
            curriculum tracks.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 pt-2">
          <a href="#mentor-form">
            <Button size="md" className="font-semibold shadow-xs">
              Apply to Mentor
            </Button>
          </a>
          <Link to="/mentors">
            <Button variant="secondary" size="md" className="font-semibold shadow-xs">
              Browse Directory
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              variant="ghost"
              size="md"
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              Contact Guild
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
