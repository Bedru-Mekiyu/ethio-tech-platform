import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Clock3,
  Code2,
  Cpu,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  submitMentorApplication,
  type MentorApplicationPayload,
} from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
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
  { value: "live-sessions", label: "Live 1-on-1 Office Hours", desc: "Weekly scheduled video mentoring & bug triage" },
  { value: "project-reviews", label: "Async Code & PR Reviews", desc: "Review student GitHub submissions at your own pace" },
  { value: "office-hours", label: "Group Cohort Masterclasses", desc: "Lead quarterly 60-minute technical deep dives" },
  { value: "cohort-support", label: "Capstone Defense Panel", desc: "Evaluate and grade graduating student architectures" },
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
    title: "Quick Application (5 Min)",
    description: "Submit your professional background, technical specialties, and preferred mentoring schedule.",
    icon: Code2,
  },
  {
    step: "02",
    title: "15-Min Alignment Chat",
    description: "Connect briefly with a Guild Coordinator to review curriculum tracks and student expectations.",
    icon: Video,
  },
  {
    step: "03",
    title: "Guild Onboarding & Tooling",
    description: "Receive access to the mentor dashboard, LiveKit video rooms, and automated GitHub review queues.",
    icon: ShieldCheck,
  },
  {
    step: "04",
    title: "First Mentee Cohort Pairing",
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
    title: "Elite Diaspora Peer Network",
    description:
      "Join private quarterly Guild roundtables, diaspora engineering dinners, and technology policy advisory circles.",
  },
  {
    icon: Trophy,
    title: "Stipends & Impact Recognition",
    description:
      "Optional honorariums for high-frequency mentors and public recognition on our National Builders Wall.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Mentoring with EthioTech is the most rewarding 2 hours of my week. Reviewing code written by brilliant students across Ethiopia reminds me why I fell in love with software engineering.",
    author: "Dawit Abebe",
    role: "Principal Systems Architect",
    company: "Diaspora Engineering Guild (Seattle / Addis)",
  },
  {
    quote:
      "We hired two junior developers directly from the cohort I mentored. They were already accustomed to PR reviews, git branching, and writing comprehensive unit tests.",
    author: "Bethlehem Tadesse",
    role: "Engineering Manager",
    company: "Fintech Startup Leader",
  },
];

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
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-24">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-6"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles size={14} />
          <span>Senior Engineering Guild Membership</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white leading-tight">
          Give Back. Shape Ethiopia&apos;s Next Generation of{" "}
          <span className="glow-text text-primary">Tech Leaders</span>
        </h1>

        <p className="mx-auto max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] md:text-xl">
          Join a prestigious guild of senior software engineers, architects, and product leaders. Share practical
          industry wisdom, bridge the digital divide, and discover top technical talent.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a href="#mentor-form">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              Complete Mentor Application (5 Min)
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>
          <a href="#onboarding-process">
            <Button variant="outline" size="lg">
              View Onboarding Process
            </Button>
          </a>
        </div>

        {/* Requirements Strip */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 max-w-3xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <ShieldCheck size={16} className="text-primary" /> Requirement: 2+ Years Senior Experience
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Clock size={16} className="text-secondary" /> Commitment: 2–4 Hours / Week
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Award size={16} className="text-success" /> Verified Digital Leadership Badge
          </span>
        </div>
      </motion.section>

      {/* ─── Benefits of Mentoring Section ─── */}
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Why Mentor With Us</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Benefits of Joining the Mentor Guild
          </h2>
          <p className="text-[var(--text-secondary)]">
            Mentoring is high-leverage impact for the student and meaningful professional elevation for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MENTOR_BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 shadow-lg"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-bold text-white text-base">{benefit.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── 4-Step Frictionless Onboarding Process ─── */}
      <section id="onboarding-process" className="space-y-10 scroll-mt-16">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="default">Streamlined Process</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            The 4-Step Mentor Onboarding Journey
          </h2>
          <p className="text-[var(--text-secondary)]">
            We value your time. Our onboarding is designed to get you matched and coaching with minimal administrative overhead.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {ONBOARDING_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.step}
                className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/95 p-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary border border-secondary/20">
                      <Icon size={18} />
                    </div>
                    <span className="text-2xl font-black text-white/20">{step.step}</span>
                  </div>
                  <h3 className="mt-5 font-bold text-white text-base">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Interactive Application Form & Guidelines ─── */}
      <section id="mentor-form" className="scroll-mt-16">
        <Card className="relative overflow-hidden border-primary/30 bg-[linear-gradient(180deg,rgba(11,18,32,0.98),rgba(6,10,20,0.98))] p-8 md:p-12 shadow-2xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Left: Expectations & Guidelines */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <ShieldCheck size={14} />
                <span>Mentor Application</span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Join the Guild
              </h2>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Tell us about your professional background, technical strengths, and preferred mentoring schedule.
                Applications are reviewed by the Guild Admissions Committee within 2–3 business days.
              </p>

              {/* Stats Summary */}
              <div className="space-y-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <Clock3 size={15} className="text-primary" /> Flexible Weekly Commitment
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Allocate 2 to 4 hours per week for asynchronous PR reviews or weekend 1-on-1 office hours.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <Award size={15} className="text-secondary" /> Senior Experience Requirement
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Minimum 2+ years of professional industry experience in engineering, product, or data.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <Trophy size={15} className="text-success" /> Tooling & Platform Provided
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Access to built-in LiveKit video rooms, automated code review dashboards, and calendar booking.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Application Form */}
            <div>
              {mutation.isSuccess ? (
                <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success border border-success/40">
                    <CheckCircle2 size={32} />
                  </div>
                  <Badge variant="success">Application Received</Badge>
                  <h3 className="text-2xl font-bold text-white">
                    Thank you, {fullName || "Fellow Engineer"}!
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-md mx-auto">
                    Your mentor application has been securely submitted to the Guild Admissions Committee. We will review
                    your background and follow up at <strong className="text-white">{email}</strong> within 48 business hours.
                  </p>
                  <div className="pt-4 flex justify-center gap-3">
                    <Link to="/mentors">
                      <Button variant="outline">Browse Mentor Directory</Button>
                    </Link>
                    <Link to="/about">
                      <Button variant="ghost" className="text-primary hover:bg-primary/10">
                        Learn About EthioTech
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label required>Full Name</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="e.g. Dawit Abebe"
                      />
                    </div>
                    <div>
                      <Label required>Email Address</Label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        placeholder="e.g. dawit@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label required>Current Professional Role</Label>
                      <Input
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        required
                        placeholder="e.g. Senior Software Architect"
                      />
                    </div>
                    <div>
                      <Label>Current Company / Organization</Label>
                      <Input
                        value={currentCompany}
                        onChange={(e) => setCurrentCompany(e.target.value)}
                        placeholder="e.g. Chapa / Google / Safaricom"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label required>Years of Professional Experience (Min 2+)</Label>
                      <Input
                        type="number"
                        min={2}
                        max={50}
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        required
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div>
                      <Label>Location / City</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Addis Ababa / Seattle / Berlin"
                      />
                    </div>
                  </div>

                  {/* Technical Expertise Domains */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                      Primary Technical Domains
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skillOptions.map((skill) => {
                        const active = expertise.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
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
                  </div>

                  {/* Mentoring Format Preferences */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                      Preferred Mentoring Formats
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2 mt-2">
                      {mentoringStyles.map((style) => {
                        const active = mentoringStyle.includes(style.value);
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => toggleStyle(style.value)}
                            className={`rounded-xl border p-3 text-left transition ${
                              active
                                ? "border-secondary bg-secondary/15 text-white"
                                : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                            }`}
                          >
                            <p className="text-xs font-bold text-white">{style.label}</p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekly Availability */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                      Weekly Time Availability
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-4 mt-2">
                      {availabilityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAvailability(opt.value)}
                          className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                            availability === opt.value
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <Label required>Why do you want to mentor with EthioTech?</Label>
                    <Textarea
                      value={whyMentor}
                      onChange={(e) => setWhyMentor(e.target.value)}
                      required
                      placeholder="Share your motivation for coaching Ethiopian junior engineers, your background, and how you hope to contribute."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>LinkedIn Profile URL</Label>
                      <Input
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div>
                      <Label>GitHub / Portfolio URL</Label>
                      <Input
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        type="url"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-elevated)] text-primary"
                    />
                    <span>
                      I confirm that I have 2+ years of professional industry experience and commit to providing respectful,
                      constructive guidance to learners.
                    </span>
                  </label>

                  {submissionError && (
                    <p className="text-xs text-danger font-medium">{submissionError}</p>
                  )}

                  {mutation.isError && (
                    <p className="text-xs text-danger font-medium">
                      {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                        (mutation.error as Error)?.message ||
                        "Unable to submit mentor application. Please verify your details."}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={mutation.isPending || !consent}
                  >
                    {mutation.isPending ? "Submitting Application..." : "Submit Application to Mentor Guild"}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Testimonials from Active Mentors ─── */}
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Guild Voices</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Hear From Our Active Senior Mentors
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/95 p-6 space-y-4"
            >
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="font-bold text-white text-sm">{t.author}</p>
                <p className="text-xs text-primary font-medium">{t.role}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="relative overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto max-w-2xl space-y-3">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Questions About Mentoring?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Reach out directly to our Guild Admissions Coordinator for questions regarding scheduling, honorariums, or
            curriculum tracks.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#mentor-form">
            <Button size="lg">Apply to Join the Guild</Button>
          </a>
          <Link to="/mentors">
            <Button variant="outline" size="lg">
              View Mentor Directory
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
              Contact Guild Lead
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
