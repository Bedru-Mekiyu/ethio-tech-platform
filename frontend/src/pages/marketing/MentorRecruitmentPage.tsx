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
import { submitMentorApplication, type MentorApplicationPayload } from "@/services/marketingService";

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
  {
    value: "project-reviews",
    label: "Async Code & PR Reviews",
    desc: "Review student GitHub submissions at your own pace",
  },
  { value: "office-hours", label: "Group Cohort Masterclasses", desc: "Lead quarterly 60-minute technical deep dives" },
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
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-20 text-[var(--text-primary)]">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-5"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400">
          <Sparkles size={13} />
          <span>Senior Engineering Guild Membership</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          Give Back. Shape Ethiopia&apos;s Next Generation of <span className="text-indigo-400">Tech Leaders</span>
        </h1>

        <p className="mx-auto max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
          Join a guild of senior software engineers, architects, and product leaders. Share practical industry wisdom,
          bridge the digital divide, and discover top technical talent.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a href="#mentor-form">
            <Button size="md" className="font-medium">
              Complete Mentor Application (5 Min)
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </a>
          <a href="#onboarding-process">
            <Button variant="outline" size="md">
              View Onboarding Process
            </Button>
          </a>
        </div>

        {/* Requirements Strip */}
        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 max-w-3xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
            <ShieldCheck size={14} className="text-indigo-400" /> Requirement: 2+ Years Senior Experience
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
            <Clock size={14} className="text-indigo-400" /> Commitment: 2–4 Hours / Week
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
            <Award size={14} className="text-emerald-400" /> Verified Leadership Badge
          </span>
        </div>
      </motion.section>

      {/* ─── Benefits of Mentoring Section ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Why Mentor With Us</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Benefits of Joining the Mentor Guild
          </h2>
          <p className="text-xs text-zinc-400">
            Mentoring is high-leverage impact for the student and meaningful professional elevation for you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MENTOR_BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 transition-all duration-150 hover:border-zinc-700 shadow-md"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-semibold text-white text-sm">{benefit.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{benefit.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── 4-Step Frictionless Onboarding Process ─── */}
      <section id="onboarding-process" className="space-y-8 scroll-mt-16">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="default">Streamlined Process</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            The 4-Step Mentor Onboarding Journey
          </h2>
          <p className="text-xs text-zinc-400">
            We value your time. Our onboarding is designed to get you matched and coaching with minimal administrative
            overhead.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ONBOARDING_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.step} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                      <Icon size={16} />
                    </div>
                    <span className="text-xl font-bold font-mono text-zinc-600">{step.step}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-white text-sm">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{step.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Interactive Application Form & Guidelines ─── */}
      <section id="mentor-form" className="scroll-mt-16">
        <Card className="relative overflow-hidden border-[#27272A] bg-[#0E0E11] p-6 md:p-10 shadow-lg">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Left: Expectations & Guidelines */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400">
                <ShieldCheck size={13} />
                <span>Mentor Application</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Join the Guild</h2>

              <p className="text-xs leading-relaxed text-zinc-400">
                Tell us about your professional background, technical strengths, and preferred mentoring schedule.
                Applications are reviewed by the Guild Admissions Committee within 2–3 business days.
              </p>

              {/* Stats Summary */}
              <div className="space-y-2.5 pt-1">
                <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <Clock3 size={14} className="text-indigo-400" /> Flexible Weekly Commitment
                  </p>
                  <p className="text-xs text-zinc-400">
                    Allocate 2 to 4 hours per week for asynchronous PR reviews or weekend 1-on-1 office hours.
                  </p>
                </div>

                <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <Award size={14} className="text-indigo-400" /> Senior Experience Requirement
                  </p>
                  <p className="text-xs text-zinc-400">
                    Minimum 2+ years of professional industry experience in engineering, product, or data.
                  </p>
                </div>

                <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <Trophy size={14} className="text-emerald-400" /> Tooling & Platform Provided
                  </p>
                  <p className="text-xs text-zinc-400">
                    Access to built-in LiveKit video rooms, automated code review dashboards, and calendar booking.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Application Form */}
            <div>
              {mutation.isSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={24} />
                  </div>
                  <Badge variant="success">Application Received</Badge>
                  <h3 className="text-xl font-bold text-white">Thank you, {fullName || "Fellow Engineer"}!</h3>
                  <p className="text-xs leading-relaxed text-zinc-400 max-w-md mx-auto">
                    Your mentor application has been securely submitted to the Guild Admissions Committee. We will
                    review your background and follow up at <strong className="text-white">{email}</strong> within 48
                    business hours.
                  </p>
                  <div className="pt-3 flex justify-center gap-3">
                    <Link to="/mentors">
                      <Button variant="outline" size="sm">
                        Browse Mentor Directory
                      </Button>
                    </Link>
                    <Link to="/about">
                      <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-white">
                        Learn About EthioTech
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
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

                  <div className="grid gap-3 sm:grid-cols-2">
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

                  <div className="grid gap-3 sm:grid-cols-2">
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
                    <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                      Primary Technical Domains
                    </Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {skillOptions.map((skill) => {
                        const active = expertise.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                              active
                                ? "border-indigo-500 bg-indigo-600 text-white"
                                : "border-[#27272A] bg-[#141418] text-zinc-400 hover:border-zinc-700 hover:text-white"
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
                    <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                      Preferred Mentoring Formats
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2 mt-1.5">
                      {mentoringStyles.map((style) => {
                        const active = mentoringStyle.includes(style.value);
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => toggleStyle(style.value)}
                            className={`rounded-lg border p-2.5 text-left transition ${
                              active
                                ? "border-indigo-500 bg-indigo-500/15 text-white"
                                : "border-[#27272A] bg-[#141418] text-zinc-400 hover:border-zinc-700 hover:text-white"
                            }`}
                          >
                            <p className="text-xs font-semibold text-white">{style.label}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weekly Availability */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                      Weekly Time Availability
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-4 mt-1.5">
                      {availabilityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAvailability(opt.value)}
                          className={`rounded-md border p-2 text-center text-xs font-medium transition ${
                            availability === opt.value
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-[#27272A] bg-[#141418] text-zinc-400 hover:border-zinc-700 hover:text-white"
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

                  <div className="grid gap-3 sm:grid-cols-2">
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
                  <label className="flex items-start gap-2.5 rounded-lg border border-[#27272A] bg-[#141418] p-3 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                      className="mt-0.5 h-4 w-4 rounded border-[#27272A] bg-[#0E0E11] text-indigo-600"
                    />
                    <span>
                      I confirm that I have 2+ years of professional industry experience and commit to providing
                      respectful, constructive guidance to learners.
                    </span>
                  </label>

                  {submissionError && <p className="text-xs text-rose-400 font-medium">{submissionError}</p>}

                  {mutation.isError && (
                    <p className="text-xs text-rose-400 font-medium">
                      {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                        (mutation.error as Error)?.message ||
                        "Unable to submit mentor application. Please verify your details."}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-medium"
                    disabled={mutation.isPending || !consent}
                  >
                    {mutation.isPending ? "Submitting Application..." : "Submit Application to Mentor Guild"}
                    <ArrowRight size={15} className="ml-2" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* ─── Testimonials from Active Mentors ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Guild Voices</Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Hear From Our Active Senior Mentors
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {TESTIMONIALS.map((t, idx) => (
            <Card key={idx} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 space-y-3">
              <p className="text-xs leading-relaxed text-zinc-300 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="pt-3 border-t border-[#27272A]">
                <p className="font-semibold text-white text-xs">{t.author}</p>
                <p className="text-xs text-indigo-400 font-medium">{t.role}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Strip ─── */}
      <Card className="relative overflow-hidden border-[#27272A] bg-[#0E0E11] p-8 md:p-10 text-center space-y-5 shadow-lg">
        <div className="mx-auto max-w-2xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Questions About Mentoring?</h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
            Reach out directly to our Guild Admissions Coordinator for questions regarding scheduling, honorariums, or
            curriculum tracks.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#mentor-form">
            <Button size="lg" className="font-medium">
              Apply to Join the Guild
            </Button>
          </a>
          <Link to="/mentors">
            <Button variant="outline" size="lg">
              View Mentor Directory
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="lg" className="text-indigo-400 hover:text-white">
              Contact Guild Lead
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
