import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Compass,
  FileCode2,
  Globe,
  GraduationCap,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTracks, type TrackSummary } from "@/services/tracksService";
import { LOCAL_MEDIA_ASSETS } from "@/config/mediaConfig";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function HowItWorksSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <Skeleton className="mx-auto h-6 w-48 rounded-full" />
        <Skeleton className="mx-auto h-14 w-full max-w-2xl" />
        <Skeleton className="mx-auto h-5 w-full max-w-xl" />
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-5">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="mt-8 h-96 w-full rounded-[28px]" />
      <Skeleton className="mt-16 h-72 rounded-[28px]" />
    </div>
  );
}

// ─── 5-Stage Learner Lifecycle Data ───
interface LifecycleStage {
  step: number;
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: LucideIcon;
  badge: string;
  overview: string;
  keyDeliverables: string[];
  toolsUsed: string[];
  telemetryMetric: { label: string; value: string };
  evaluationCriteria: string[];
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    step: 1,
    id: "track-selection",
    title: "1. Diagnostic Calibration & Track Selection",
    shortTitle: "1. Diagnostic & Track",
    subtitle: "Adaptive baseline assessment matching ambition with high-demand stacks",
    icon: Compass,
    badge: "Adaptive Onboarding",
    overview:
      "Learners complete an adaptive 45-minute technical assessment evaluating algorithmic logic and system fundamentals. The calibration engine places each learner into their optimal track tier with a personalized roadmap.",
    keyDeliverables: [
      "Customized 16-week learning roadmap with estimated completion milestone",
      "Automated squad matchmaking placing you with 4-5 complementary peers",
      "Pre-configured cloud devcontainer environment with zero local setup hurdles",
    ],
    toolsUsed: ["Adaptive Diagnostic Engine", "Squad Matchmaker", "Skill Matrix Graph"],
    telemetryMetric: { label: "Assessment Window", value: "45 Minutes" },
    evaluationCriteria: [
      "Algorithmic fundamentals & problem solving assessment",
      "Curriculum pathway & entry tier calibration",
      "Squad timezone and weekly availability match",
    ],
  },
  {
    step: 2,
    id: "live-mentorship",
    title: "2. Low-Latency Live Mentorship",
    shortTitle: "2. Live Mentorship",
    subtitle: "Sub-150ms pair programming and code reviews with senior tech leads",
    icon: Radio,
    badge: "Sub-150ms WebRTC",
    overview:
      "Students join interactive live classrooms and weekly office hours with synchronized code editors and low-bandwidth WebRTC audio, maintaining responsiveness even over regional 3G and 4G networks.",
    keyDeliverables: [
      "Weekly 30-minute 1-on-1 architectural consultations with Staff/Senior engineers",
      "Live squad debugging clinics with shared terminal and audio synchronization",
      "System design masterclasses breaking down real production architectures",
    ],
    toolsUsed: ["Monaco Synchronized IDE", "WebRTC Audio Mesh", "Realtime Whiteboard"],
    telemetryMetric: { label: "Live Lab Audio Codec", value: "Opus @ 32kbps" },
    evaluationCriteria: [
      "Weekly 1-on-1 architectural consultation attendance",
      "Active participation in live collaborative debugging sessions",
      "Consistent milestone progression across live clinics",
    ],
  },
  {
    step: 3,
    id: "sandbox-building",
    title: "3. Sandbox Project Building",
    shortTitle: "3. Sandbox Building",
    subtitle: "In-browser Linux containers, real databases & automated CI test suites",
    icon: Terminal,
    badge: "Production Labs",
    overview:
      "Every module requires shipping tested code. Using in-browser Linux containers, learners build distributed backends, implement secure authentication, optimize database queries, and write automated test suites.",
    keyDeliverables: [
      "Production-ready GitHub repositories with full commit and branching history",
      "Automated unit, integration, and security test suites with >85% code coverage",
      "Live containerized deployments on cloud staging environments",
    ],
    toolsUsed: ["Docker Devcontainers", "WASM Micro-kernels", "Jest/PyTest Runners"],
    telemetryMetric: { label: "Test Coverage Requirement", value: ">= 85%" },
    evaluationCriteria: [
      "Production Git repository with clear atomic commit history",
      "Automated test suite passing with >= 85% statement coverage",
      "Zero security warnings and clean linter audit",
    ],
  },
  {
    step: 4,
    id: "squad-review",
    title: "4. Squad Peer Review & Architectural Defense",
    shortTitle: "4. Squad Code Review",
    subtitle: "PR reviews, squad code audits, and live design defense sessions",
    icon: FileCode2,
    badge: "Peer & Mentor Sign-Off",
    overview:
      "Before code merges, learners submit pull requests to their 4-peer squad. Students review code for logic and security, then defend architectural choices during weekly mentor standups.",
    keyDeliverables: [
      "At least 2 peer code approvals and 1 mentor architectural sign-off per feature",
      "Live 15-minute architectural defense presentation of system design choices",
      "Squad XP bonuses and peer reputation score boosts for helpful reviews",
    ],
    toolsUsed: ["EthioTech PR Reviewer", "Code Diff Heatmaps", "Squad Standup Bots"],
    telemetryMetric: { label: "Peer Review Requirement", value: ">= 2 Approvals / PR" },
    evaluationCriteria: [
      "Minimum 2 approved peer code reviews per pull request",
      "Live 15-minute architecture defense with mentor sign-off",
      "Thorough peer feedback contributions to squad members",
    ],
  },
  {
    step: 5,
    id: "verified-placement",
    title: "5. Verified Skill Passport & Career Placement",
    shortTitle: "5. Verified Placement",
    subtitle: "Verified credentials, proof-of-work portfolio & direct employer hiring",
    icon: Trophy,
    badge: "Direct Hiring Pipeline",
    overview:
      "Upon track completion and capstone defense, learners receive a verified Skill Passport linking to their audited GitHub repositories, opening direct interview pathways with partner companies.",
    keyDeliverables: [
      "Verified Skill Passport detailing validated technical competencies",
      "Live interactive portfolio featuring deployed apps and commit timelines",
      "Direct interview referrals with vetted hiring partners (Zero recruiter fees)",
    ],
    toolsUsed: ["Talent Passport Verifier", "Employer Talent Directory", "Alumni Network"],
    telemetryMetric: { label: "Employer Hiring Model", value: "Direct & Fee-Free" },
    evaluationCriteria: [
      "Completed track curriculum and capstone project deliverable",
      "Senior engineering fellow verification of core competencies",
      "Publicly accessible verifiable credential with shareable portfolio",
    ],
  },
];

// ─── Persona Breakdown Data ───
interface RolePersona {
  id: "student" | "mentor" | "employer";
  title: string;
  badge: string;
  icon: LucideIcon;
  description: string;
  image: string;
  imageAlt: string;
  keyBenefits: Array<{ title: string; desc: string; icon: LucideIcon }>;
  ctaLabel: string;
  ctaLink: string;
}

const ROLE_PERSONAS: RolePersona[] = [
  {
    id: "student",
    title: "The Student Experience",
    badge: "100% Free Tuition",
    icon: GraduationCap,
    description:
      "Advance your technical capabilities through structured tracks, hands-on production codebases, collaborative squads, and direct guidance from experienced software engineers.",
    image: LOCAL_MEDIA_ASSETS.hero.collaboration,
    imageAlt:
      "African software engineer in headphones reviewing terminal commands and VS Code files on a curved display",
    keyBenefits: [
      {
        title: "Zero Financial Barriers",
        desc: "100% free access to all curriculum, dev environments, and mentorship sessions. No hidden fees or debt contracts.",
        icon: CheckCircle2,
      },
      {
        title: "Team Squads & Accountability",
        desc: "Learn in a 4-6 person agile cohort with daily standups, peer code reviews, and shared git branching workflows.",
        icon: Users,
      },
      {
        title: "Verified Talent Passport",
        desc: "Graduate with a verifiable digital skill credential and public portfolio of production apps that employers trust.",
        icon: Trophy,
      },
      {
        title: "Regional Hub Access",
        desc: "Gain access to physical EthioTech Learning Hubs with reliable power, fast internet, and workstations across Ethiopia.",
        icon: Code2,
      },
    ],
    ctaLabel: "Enroll Free",
    ctaLink: "/register",
  },
  {
    id: "mentor",
    title: "The Mentor Experience",
    badge: "Flexible 1-3 hrs/week",
    icon: Users,
    description: "Share your expertise through structured office hours, PR reviews, and system design masterclasses.",
    image: LOCAL_MEDIA_ASSETS.mentorship.codeReview,
    imageAlt:
      "Senior African software engineer conducting a pair programming code review session with a developer over dual monitors",
    keyBenefits: [
      {
        title: "High-Leverage Structured Format",
        desc: "Our platform automates scheduling and code review queues, letting you deliver outsized impact in just 1-3 hours weekly.",
        icon: Clock,
      },
      {
        title: "Guide Emerging Engineers",
        desc: "Directly mentor high-potential engineers and help shape competent production software engineers.",
        icon: Sparkles,
      },
      {
        title: "Senior Engineering Community",
        desc: "Connect with fellow senior engineers, managers, and founders across global and regional tech ecosystems.",
        icon: Globe,
      },
      {
        title: "Mentor Recognition & Accolades",
        desc: "Earn recognized mentor badges, alumni endorsements, and leadership recognition within the global tech community.",
        icon: ShieldCheck,
      },
    ],
    ctaLabel: "Become a Mentor",
    ctaLink: "/mentor-recruitment",
  },
  {
    id: "employer",
    title: "The Hiring Partner Experience",
    badge: "Zero Placement Fees",
    icon: Award,
    description:
      "Hire vetted, production-ready software engineers with verified proof-of-work, production git histories, and strong teamwork habits.",
    image: LOCAL_MEDIA_ASSETS.events.hackathon,
    imageAlt:
      "African software engineering team collaborating on laptops covered in developer community stickers during a hackathon sprint",
    keyBenefits: [
      {
        title: "Proof-of-Work Over Resumes",
        desc: "Inspect live deployed projects, GitHub commit histories, and recorded architectural defense presentations for every graduate.",
        icon: FileCode2,
      },
      {
        title: "Zero Placement or Recruiter Fees",
        desc: "We operate as a non-profit digital public good. Hire our top graduates directly with no commission markups.",
        icon: CheckCircle2,
      },
      {
        title: "Day-One Production Ready",
        desc: "Graduates are already proficient in git workflows, CI/CD pipelines, Docker, automated testing, and agile squad collaboration.",
        icon: Terminal,
      },
      {
        title: "Capstone Project Sponsorship",
        desc: "Sponsor real company challenges as final capstone projects and evaluate candidate performance in real-time.",
        icon: Trophy,
      },
    ],
    ctaLabel: "Partner with Us",
    ctaLink: "/partners",
  },
];

// ─── FAQ Data ───
interface FaqItem {
  question: string;
  answer: string;
  category: "students" | "mentors" | "partners";
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is EthioTech really 100% free? Are there any hidden fees or ISA contracts?",
    answer:
      "Yes, EthioTech is 100% free for all students. We do not charge tuition, registration fees, or income-share agreements (ISAs). We operate as an open-impact digital public good funded by philanthropic donations, educational grants, and non-extractive enterprise sponsorships.",
    category: "students",
  },
  {
    question: "How can I participate if my regional internet connection is slow or intermittent?",
    answer:
      "EthioTech is engineered from the ground up for low-bandwidth environments. Our web app operates offline with ServiceWorker caching, lessons can be downloaded locally, code exercises run in in-browser WASM micro-containers, and live sessions use ultra-efficient audio compression under 32kbps. Additionally, students can visit our physical regional hubs in university cities.",
    category: "students",
  },
  {
    question: "What is the expected weekly time commitment for a student?",
    answer:
      "Our Standard Track requires approximately 12-15 hours per week (ideal for university students taking classes concurrently), while our Full-Time Intensive Cohort requires 30-35 hours per week. Both tracks include weekly live mentor office hours and squad review standups.",
    category: "students",
  },
  {
    question: "What are the requirements to become a mentor?",
    answer:
      "We welcome software engineers, tech leads, engineering managers, and architects with 2+ years of professional production experience. We look for individuals committed to volunteering 1-3 hours per week for code reviews, 1-on-1 office hours, or tech talks.",
    category: "mentors",
  },
  {
    question: "How does mentor scheduling and time commitment work?",
    answer:
      "Mentors set their own availability on our mentor dashboard (e.g. two 30-minute slots on weekends or weekday evenings). Our platform matches learners and prepares pre-screened PR diffs and questions in advance so sessions are focused and high-leverage.",
    category: "mentors",
  },
  {
    question: "How do employers verify student certifications and skill claims?",
    answer:
      "Every EthioTech graduate receives a cryptographically verifiable Skill Passport with a public verification link. Employers can inspect actual GitHub commit logs, test coverage reports, and view recorded architectural defenses rather than relying on unverified resume bullet points.",
    category: "partners",
  },
  {
    question: "How can local universities and tech hubs partner with EthioTech?",
    answer:
      "We partner with regional universities to establish physical EthioTech Learning Hubs, providing curriculum co-alignment, mentor support, and access to cloud dev environments. Contact our partnership team to explore opening a hub at your institution.",
    category: "partners",
  },
];

export function HowItWorksPage() {
  const reduceMotion = useReducedMotion();
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [activeRole, setActiveRole] = useState<"student" | "mentor" | "employer">("student");
  const [faqCategory, setFaqCategory] = useState<"all" | "students" | "mentors" | "partners">("all");
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tracks", "how-it-works"],
    queryFn: fetchTracks,
  });

  const currentStage = LIFECYCLE_STAGES[activeStageIndex] || LIFECYCLE_STAGES[0];
  const currentRoleData = ROLE_PERSONAS.find((r) => r.id === activeRole) || ROLE_PERSONAS[0];

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = faqCategory === "all" || item.category === faqCategory;
      const matchesSearch =
        faqSearchQuery.trim() === "" ||
        item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqCategory, faqSearchQuery]);

  if (isLoading) {
    return <HowItWorksSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load the learning journey right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const tracks = (Array.isArray(data) ? data : []) as TrackSummary[];
  const featuredTracks = tracks.length > 0 ? tracks.slice(0, 3) : [];
  const totalModules = tracks.reduce((sum, track) => sum + (track.modules?.length ?? 0), 0);
  const totalLessons = tracks.reduce(
    (sum, track) =>
      sum + (track.modules?.reduce((lessonSum, module) => lessonSum + (module.lessons?.length ?? 0), 0) ?? 0),
    0,
  );
  const totalXp = tracks.reduce((sum, track) => sum + (track.xpReward ?? 0), 0);

  return (
    <div className="relative min-h-screen text-[var(--text-primary)]">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:pt-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white break-words">
            How aspiring engineers become <span className="text-primary">production-ready</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
            From baseline calibration to small-group mentor pairing, sandbox development, squad code defense, and
            verified career placement.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="font-medium w-full sm:w-auto">
                Create Student Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              className="font-medium w-full sm:w-auto"
              onClick={() => {
                const el = document.getElementById("learner-lifecycle");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Stages
            </Button>
          </div>
        </div>

        {/* Live Catalog Momentum Metrics Strip */}
        <div className="mt-10 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5 shadow-xs max-w-5xl mx-auto">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/10 md:grid-cols-4 text-center">
            <div className="pt-2 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCompactNumber(tracks.length)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Engineering Tracks</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Fullstack, AI, Cloud, Mobile</p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-4">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCompactNumber(totalModules)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Interactive Modules</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Structured syllabus progression</p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-4">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCompactNumber(totalLessons)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Hands-on Labs</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Real codebases and PR reviews</p>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-4">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCompactNumber(totalXp)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Total Skill XP</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Earned via audited completions</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── 5-Stage Interactive Learner Lifecycle ─── */}
      <section
        id="learner-lifecycle"
        className="border-t border-slate-200/80 bg-slate-50/50 dark:bg-slate-900/50 py-12 lg:py-14"
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
              The 5-Stage Learner Lifecycle
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
              Click through each stage to explore how we guide learners from diagnostic calibration to verified career
              placement.
            </p>
          </div>

          {/* Stepper Stage Selector */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:grid-cols-5 md:gap-3">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isActive = idx === activeStageIndex;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`group relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-150 ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs font-semibold"
                      : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-[var(--shadow-xs)]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {stage.step}
                    </span>
                    <Icon size={16} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"} />
                  </div>
                  <p className="mt-2.5 text-xs font-semibold line-clamp-1">{stage.shortTitle}</p>
                  <span className={`mt-0.5 text-[10px] ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                    {stage.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Breakdown */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]"
              >
                <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-12 lg:items-center">
                  {/* Left: Narrative, Deliverables & Tools */}
                  <div className="space-y-4 lg:col-span-7">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          Stage {currentStage.step} of 5
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {currentStage.badge}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">{currentStage.title}</h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">{currentStage.subtitle}</p>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600">{currentStage.overview}</p>

                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Key Deliverables & Milestones
                      </h4>
                      <ul className="mt-2 space-y-1.5">
                        {currentStage.keyDeliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Platform Tools:
                      </span>
                      {currentStage.toolsUsed.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          {currentStage.telemetryMetric.label}
                        </p>
                        <p className="text-base font-bold text-slate-900">{currentStage.telemetryMetric.value}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Code Simulation & Step Action */}
                  <div className="space-y-3 lg:col-span-5">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 dark:bg-slate-900/50 p-5 shadow-[var(--shadow-xs)] space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                        <h4 className="text-xs font-bold text-slate-900">Stage {currentStage.step} Quality Gates</h4>
                        <Badge variant="secondary" size="sm">
                          {currentStage.badge}
                        </Badge>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                          Evaluation Criteria
                        </p>
                        {currentStage.evaluationCriteria.map((criterion) => (
                          <div key={criterion} className="flex items-start gap-2.5 text-xs text-slate-700">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
                            <span>{criterion}</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-white p-3 flex items-center justify-between text-xs shadow-[var(--shadow-xs)]">
                        <span className="text-slate-600 font-medium">Stage Target Benchmark:</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {currentStage.telemetryMetric.value}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={activeStageIndex === 0}
                        onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                        className="text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      >
                        Previous Stage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStageIndex((prev) => (prev + 1) % LIFECYCLE_STAGES.length)}
                        className="text-slate-700 hover:text-slate-900 font-medium"
                      >
                        {activeStageIndex === LIFECYCLE_STAGES.length - 1 ? "Replay Lifecycle" : "Next Stage"}
                        <ArrowRight size={13} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─── 3-Way Persona Experience Breakdown ─── */}
      <motion.section
        className="mx-auto max-w-7xl px-4 py-12 lg:py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
            What It Looks Like For You
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
            Explore how students, engineering mentors, and hiring partners collaborate inside EthioTech.
          </p>

          {/* Role Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {ROLE_PERSONAS.map((persona) => {
              const isActive = persona.id === activeRole;
              const Icon = persona.icon;
              return (
                <button
                  key={persona.id}
                  onClick={() => setActiveRole(persona.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-red-400" : "text-[var(--secondary)]"} />
                  <span>{persona.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Card Breakdown */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoleData.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-slate-900 md:text-2xl">{currentRoleData.title}</h3>
                    <Badge variant="secondary" size="md">
                      {currentRoleData.badge}
                    </Badge>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{currentRoleData.description}</p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {currentRoleData.keyBenefits.map((benefit) => {
                      const Icon = benefit.icon;
                      return (
                        <div
                          key={benefit.title}
                          className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--secondary)] border border-blue-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                            <Icon size={14} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-slate-900">{benefit.title}</h4>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{benefit.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-start">
                    <Link to={currentRoleData.ctaLink}>
                      <Button size="md" className="font-semibold shadow-xs">
                        {currentRoleData.ctaLabel} <ArrowRight size={14} className="ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-xs dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                    <SmartImage
                      src={currentRoleData.image}
                      alt={currentRoleData.imageAlt}
                      aspectRatio="aspect-[4/3]"
                      className="w-full object-cover"
                    />
                    <div className="border-t border-slate-200 bg-slate-50/90 px-3.5 py-2.5">
                      <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{currentRoleData.imageAlt}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ─── Featured Track Pathways ─── */}
      <section className="border-t border-slate-200/80 bg-slate-50/60 dark:bg-slate-900/50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
              Choose Your Engineering Pathway
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
              Hyper-focused tracks designed to build the exact capabilities global and African employers demand.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {(featuredTracks.length > 0
              ? featuredTracks
              : [
                  {
                    _id: "fs",
                    title: "Fullstack Cloud Architecture",
                    description: "Modern TypeScript, Next.js, Node.js, Go, PostgreSQL, Docker, and WebSockets.",
                    xpReward: 8000,
                    moduleCount: 8,
                  },
                  {
                    _id: "ai",
                    title: "Applied AI & Systems Engineering",
                    description: "Python, PyTorch, LLM orchestration, local embeddings, and scalable inference.",
                    xpReward: 8500,
                    moduleCount: 8,
                  },
                  {
                    _id: "devops",
                    title: "Cloud DevOps & Distributed Systems",
                    description: "Linux systems, Kubernetes, Terraform, CI/CD pipelines, and observability.",
                    xpReward: 7500,
                    moduleCount: 7,
                  },
                ]
            ).map((track) => {
              const moduleCount =
                "modules" in track && Array.isArray(track.modules)
                  ? track.modules.length
                  : "moduleCount" in track && typeof track.moduleCount === "number"
                    ? track.moduleCount
                    : 6;

              return (
                <Card
                  key={track._id || track.title}
                  className="flex flex-col justify-between rounded-2xl border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" size="sm" className="border-slate-200 text-slate-700 font-medium">
                        {moduleCount} Modules
                      </Badge>
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-900">
                        <Zap size={13} className="text-[var(--secondary)]" /> {track.xpReward ?? 6000} XP
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900">{track.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {track.description || "Comprehensive hands-on curriculum with real project checkpoints."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/80">
                    <Link to="/register">
                      <Button variant="secondary" size="sm" className="w-full justify-between font-semibold">
                        <span>Enroll Now</span>
                        <ArrowRight size={13} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Interactive Filterable FAQ ─── */}
      <motion.section
        className="mx-auto max-w-5xl px-4 py-12 lg:py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
            Everything you need to know about our pedagogy, time requirements, mentorship, and certification.
          </p>

          {/* Search & Category Filter */}
          <div className="mt-8 space-y-3">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search questions (e.g. internet, cost, mentor, hiring)..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {(["all", "students", "mentors", "partners"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    faqCategory === cat
                      ? "border border-slate-900 bg-slate-900 text-white font-semibold shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs"
                  }`}
                >
                  {cat === "all" ? "All Questions" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-8 space-y-2.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <Card
                  key={faq.question}
                  className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-xs transition-all hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-slate-900 hover:bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <span className="text-xs sm:text-sm font-semibold">{faq.question}</span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-slate-500 transition-transform duration-150 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="border-t border-slate-200 px-4 pb-4 pt-2.5 text-xs leading-relaxed text-slate-600 bg-slate-50/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching questions found. Try searching for something else.
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-14 pt-4 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden rounded-2xl border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
                Ready to build production-grade software?
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                Enroll in a track, collaborate with your squad, and build software with guidance from experienced
                engineers.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button size="md" className="w-full sm:w-auto font-semibold shadow-xs">
                  Enroll Now
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="secondary" size="md" className="w-full sm:w-auto font-semibold shadow-xs">
                  View Leaderboard
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full sm:w-auto text-slate-700 hover:text-slate-900 font-medium"
                >
                  Become a Mentor <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
