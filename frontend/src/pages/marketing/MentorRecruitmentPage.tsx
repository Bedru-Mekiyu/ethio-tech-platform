import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
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
  { value: "weeknights", title: "Weeknights", hours: "2–4 hrs/wk" },
  { value: "weekends", title: "Weekends", hours: "2–4 hrs/wk" },
  { value: "flexible", title: "Flexible Async", hours: "2 hrs/wk" },
  { value: "ad-hoc", title: "Ad-hoc Monthly", hours: "1–2 hrs" },
] as const;

const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Application",
    description: "Submit your engineering background, specialties, and preferred schedule.",
    icon: Code2,
  },
  {
    step: "02",
    title: "Alignment",
    description: "Brief orientation call with a Guild Lead to align on expectations.",
    icon: Video,
  },
  {
    step: "03",
    title: "Guild Activation",
    description: "Access your dashboard, review queues, and live session tools.",
    icon: ShieldCheck,
  },
  {
    step: "04",
    title: "Cohort Pairing",
    description: "Connect with learners whose project stacks match your expertise.",
    icon: Rocket,
  },
];

const MENTOR_BENEFITS = [
  {
    icon: Award,
    title: "Verified Credentials",
    description: "Earn verified digital leadership and mentorship credentials for your resume.",
  },
  {
    icon: Users,
    title: "Talent Scouting",
    description: "First-look access to high-performing student engineers for hiring and internships.",
  },
  {
    icon: Cpu,
    title: "Engineering Network",
    description: "Connect with fellow senior engineers, technical leads, and founders across Africa.",
  },
  {
    icon: Trophy,
    title: "Community Impact",
    description: "Directly shape the next generation of engineers shipping software from Ethiopia.",
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
  optional,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100"
      >
        {children}
        {optional && (
          <span className="ml-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">(Optional)</span>
        )}
      </label>
      {hint && <span className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</span>}
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
      </motion.section>

      {/* ─── Value Proposition ─── */}
      <section className="space-y-6">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            High Impact. Zero Administrative Overhead.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            We handle curriculum design, squad coordination, and student vetting so you can focus entirely on
            high-signal engineering coaching.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENTOR_BENEFITS.map((benefit, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{benefit.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4-Step Onboarding Process ─── */}
      <section id="onboarding-process" className="space-y-6 scroll-mt-20">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            The 4-Step Mentor Onboarding Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Designed to get you matched with motivated learners with minimal friction.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ONBOARDING_STEPS.map((step) => (
            <div
              key={step.step}
              className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-white/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Step {step.step}</span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white text-sm">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Application Form & Sidebar ─── */}
      <section id="mentor-form" className="scroll-mt-20 max-w-6xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-12 items-start">
          {/* Left Column: Sticky Information & Testimonial */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            {/* Quick Overview Block */}
            <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                What to Expect
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span>
                    <strong>Experience requirement:</strong> 2+ years of professional engineering experience.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span>
                    <strong>Commitment:</strong> 2–4 hours/week for async PR reviews or live office hours.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span>
                    <strong>Tooling provided:</strong> LiveKit rooms, GitHub review queues, and calendar booking.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span>
                    <strong>Admissions:</strong> Reviewed within 2–3 business days.
                  </span>
                </li>
              </ul>
            </div>

            {/* Testimonial Quote */}
            <blockquote className="border-l-2 border-slate-300 dark:border-white/20 pl-4 py-1 space-y-1.5 text-xs">
              <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">
                &ldquo;Reviewing PRs from students in Jimma and Bahir Dar is the most impactful engineering service I do
                all week.&rdquo;
              </p>
              <footer className="text-[11px] text-slate-500 dark:text-slate-400">
                — <strong className="text-slate-800 dark:text-slate-200 font-semibold">Selamawit T.</strong>, Staff SRE
              </footer>
            </blockquote>

            {/* Application Flow Anchor */}
            <div className="hidden lg:block pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 border-t border-slate-200/60 dark:border-white/10">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Application Sections:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>About You</li>
                <li>Areas of Expertise</li>
                <li>Mentoring Preferences</li>
                <li>Motivation & Background</li>
                <li>Verification & Submission</li>
              </ol>
            </div>
          </aside>

          {/* Right Column: Application Form */}
          <div className="w-full">
            {mutation.isSuccess ? (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-10 text-center space-y-5 shadow-xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary">Application Received</Badge>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-1">
                    Thank you, {fullName || "Fellow Engineer"}!
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Your mentor application has been securely submitted to the Guild Admissions Committee. We will
                    review your background and follow up at{" "}
                    <strong className="text-slate-900 dark:text-white font-semibold">{email}</strong> within 48 business
                    hours.
                  </p>
                </div>

                {/* Review Roadmap */}
                <div className="max-w-md mx-auto rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/50 p-4 text-left space-y-2 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">What Happens Next:</p>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-400">
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
              <Card className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:p-10 shadow-xs">
                {/* Form Header */}
                <div className="pb-6 border-b border-slate-100 dark:border-white/10 space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Mentor Fellowship Application
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All fields are required unless marked optional.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="pt-6 space-y-8" noValidate>
                  {/* ─── Section 1: About You ─── */}
                  <fieldset className="space-y-4">
                    <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      1. About You
                    </legend>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          aria-required="true"
                          placeholder="e.g. Dawit Abebe"
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="email">Email Address</FieldLabel>
                        <Input
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          required
                          aria-required="true"
                          placeholder="e.g. dawit@example.com"
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="currentRole">Current Professional Role</FieldLabel>
                        <Input
                          id="currentRole"
                          value={currentRole}
                          onChange={(e) => setCurrentRole(e.target.value)}
                          required
                          aria-required="true"
                          placeholder="e.g. Senior Software Architect"
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="currentCompany" optional>
                          Current Company / Organization
                        </FieldLabel>
                        <Input
                          id="currentCompany"
                          value={currentCompany}
                          onChange={(e) => setCurrentCompany(e.target.value)}
                          placeholder="e.g. Technology Firm / Startup"
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="yearsExperience" hint="Min. 2 years">
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
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="location" optional>
                          Location / City
                        </FieldLabel>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Addis Ababa / Seattle / Berlin"
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <hr className="border-slate-100 dark:border-white/10" />

                  {/* ─── Section 2: Technical Domains ─── */}
                  <fieldset className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          2. Areas of Expertise
                        </legend>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Select the technical domains you feel comfortable mentoring learners in.
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-white/10">
                        {expertise.length} selected
                      </span>
                    </div>

                    <div
                      className="grid gap-2 grid-cols-1 sm:grid-cols-2 pt-1"
                      role="group"
                      aria-label="Technical Domains"
                    >
                      {skillOptions.map((skill) => {
                        const active = expertise.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            aria-pressed={active}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium text-left transition-all duration-150 min-h-[44px] ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold dark:border-white dark:bg-white dark:text-slate-950 ring-1 ring-slate-900 dark:ring-white"
                                : "border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <span className="leading-snug">{skill}</span>
                            <div
                              className={`h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                active
                                  ? "border-white bg-white text-slate-900 dark:border-slate-900 dark:bg-slate-900 dark:text-white"
                                  : "border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900"
                              }`}
                            >
                              {active && <Check size={11} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <hr className="border-slate-100 dark:border-white/10" />

                  {/* ─── Section 3: Mentoring Preferences ─── */}
                  <fieldset className="space-y-5">
                    <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      3. Mentoring Preferences
                    </legend>

                    {/* Mentoring Formats */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Preferred Mentoring Formats
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Select one or more formats that align with your weekly schedule.
                        </p>
                      </div>

                      <div className="space-y-2" role="group" aria-label="Mentoring Formats">
                        {mentoringStyles.map((style) => {
                          const active = mentoringStyle.includes(style.value);
                          return (
                            <button
                              key={style.value}
                              type="button"
                              onClick={() => toggleStyle(style.value)}
                              aria-pressed={active}
                              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 min-h-[44px] ${
                                active
                                  ? "border-slate-900 bg-slate-50/80 dark:bg-white/[0.05] dark:border-white text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-900 dark:ring-white"
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20"
                              }`}
                            >
                              <div
                                className={`mt-0.5 h-4 w-4 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                  active
                                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                                    : "border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900"
                                }`}
                              >
                                {active && <Check size={11} strokeWidth={3} />}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{style.label}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                                  {style.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekly Availability */}
                    <div className="space-y-2 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Weekly Time Availability
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Estimated hours per week you can dedicate to mentoring.
                        </p>
                      </div>

                      <div
                        className="grid gap-2 grid-cols-1 sm:grid-cols-2"
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
                              className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all duration-150 min-h-[44px] ${
                                active
                                  ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold dark:border-white dark:bg-white dark:text-slate-950 ring-1 ring-slate-900 dark:ring-white"
                                  : "border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              <span>{opt.title}</span>
                              <span
                                className={`text-[11px] ${
                                  active ? "text-slate-300 dark:text-slate-600" : "text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                {opt.hours}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </fieldset>

                  <hr className="border-slate-100 dark:border-white/10" />

                  {/* ─── Section 4: Motivation & Background ─── */}
                  <fieldset className="space-y-4">
                    <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      4. Motivation & Background
                    </legend>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="whyMentor"
                          className="block text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100"
                        >
                          Why do you want to mentor with EthioTech?
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {whyMentor.trim().length} / 15 chars min
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        Share your motivation for coaching Ethiopian junior engineers, your background, and how you hope
                        to contribute.
                      </p>
                      <Textarea
                        id="whyMentor"
                        value={whyMentor}
                        onChange={(e) => setWhyMentor(e.target.value)}
                        required
                        aria-required="true"
                        placeholder="e.g. I have 6 years of experience building distributed Go backends and want to help local students transition into production engineering..."
                        rows={3}
                        className="min-h-[100px] text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="linkedin" optional>
                          LinkedIn Profile URL
                        </FieldLabel>
                        <Input
                          id="linkedin"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="portfolio" optional>
                          GitHub / Portfolio URL
                        </FieldLabel>
                        <Input
                          id="portfolio"
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          type="url"
                          placeholder="https://github.com/..."
                          className="h-10 text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-primary/20 shadow-xs"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <hr className="border-slate-100 dark:border-white/10" />

                  {/* ─── Section 5: Verification & Submission ─── */}
                  <fieldset className="space-y-4">
                    <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      5. Verification & Submission
                    </legend>

                    {/* Consent Checkbox */}
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        required
                        aria-required="true"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-primary"
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
                          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
                            ?.message ||
                            (mutation.error as Error)?.message ||
                            "Unable to submit mentor application. Please verify your details and try again."}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 space-y-2.5">
                      <Button
                        type="submit"
                        size="md"
                        className="w-full font-semibold shadow-xs h-11"
                        disabled={mutation.isPending || !consent}
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 size={15} className="mr-2 animate-spin" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            Submit Mentor Application
                            <ArrowRight size={15} className="ml-1.5" />
                          </>
                        )}
                      </Button>
                      <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                        Applications are reviewed by the Guild Admissions Committee within 2–3 business days. You will
                        receive an email confirmation with next steps.
                      </p>
                    </div>
                  </fieldset>
                </form>
              </Card>
            )}
          </div>
        </div>
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
            <div
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
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-10 text-center space-y-4 shadow-2xs">
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
      </div>
    </div>
  );
}
