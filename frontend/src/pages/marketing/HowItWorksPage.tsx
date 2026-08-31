import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Compass,
  FileCode2,
  Globe,
  GraduationCap,
  Layers3,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTracks, type TrackSummary } from "@/services/tracksService";

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
  codeMock: {
    filename: string;
    code: string;
  };
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
      "Learners begin with an adaptive 45-minute technical assessment evaluating algorithmic logic, system fundamentals, and career objectives. Our calibration engine maps learners to their optimal entry tier—from CS Foundations to Fullstack Cloud, Applied AI Systems, Cloud DevOps, or Mobile Engineering.",
    keyDeliverables: [
      "Customized 16-week learning roadmap with estimated completion milestone",
      "Automated squad matchmaking placing you with 4-5 complementary peers",
      "Pre-configured cloud devcontainer environment with zero local setup hurdles",
    ],
    toolsUsed: ["Adaptive Diagnostic Engine", "Squad Matchmaker", "Skill Matrix Graph"],
    telemetryMetric: { label: "Diagnostic Accuracy", value: "96.8%" },
    codeMock: {
      filename: "calibration-engine.ts",
      code: `// Stage 1: Diagnostic Profile Calibration
export async function calibrateLearnerPath(profile: DiagnosticSubmission): Promise<CalibratedPath> {
  const recommendations = await evaluateKnowledgeGraph({
    algorithms: profile.scoreLogic,
    systemDesign: profile.scoreArchitecture,
    preferredLanguage: profile.primaryLang,
    weeklyCommitmentHrs: profile.hoursAvailable
  });

  return {
    assignedTrack: recommendations.primaryTrack, // e.g. "FULLSTACK_CLOUD"
    recommendedSquadId: await findOptimalSquad(profile.region, profile.schedule),
    baselineXP: 250
  };
}`,
    },
  },
  {
    step: 2,
    id: "live-mentorship",
    title: "2. Low-Latency Live Mentorship",
    shortTitle: "2. Live Mentorship",
    subtitle: "Sub-150ms pair-programming with Ethiopian diaspora tech leads",
    icon: Radio,
    badge: "Sub-150ms WebRTC",
    overview:
      "Forget static pre-recorded videos. Students join interactive live labs and weekly 1-on-1 office hours powered by WebRTC mesh audio and synchronized code editors, streaming at under 48kbps to maintain fast responsiveness even over 3G/4G networks across regional Ethiopia.",
    keyDeliverables: [
      "Weekly 30-minute 1-on-1 architectural consultations with Staff/Senior engineers",
      "Live squad debugging clinics with shared terminal and audio synchronization",
      "System design masterclasses breaking down real production architectures",
    ],
    toolsUsed: ["Monaco Synchronized IDE", "WebRTC Audio Mesh", "Realtime Whiteboard"],
    telemetryMetric: { label: "Avg Live Audio Latency", value: "< 120ms" },
    codeMock: {
      filename: "webrtc-pair-session.ts",
      code: `// Stage 2: WebRTC Low-Bandwidth Live Sync
const liveSession = new CollaborativeLabRoom({
  roomId: "eth-track-fs-squad-4",
  mentor: "Abebe.B (Staff Eng @ Diaspora Network)",
  codecOptions: { audioOnly: true, maxBitrateKbps: 32 },
  operationalTransform: { syncDeltaMs: 50 }
});

liveSession.on("peer-cursor-move", ({ line, char, user }) => {
  renderMentorCursor(user, line, char);
});`,
    },
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
      "Every module requires shipping production-grade code. Using in-browser WebAssembly kernels and containerized microservices, learners build real distributed backends, implement JWT/OAuth authentication, optimize database indexing, and write comprehensive automated test suites.",
    keyDeliverables: [
      "Production-ready GitHub repositories with full commit and branching history",
      "Automated unit, integration, and security test suites with >85% code coverage",
      "Live containerized deployments on cloud staging environments",
    ],
    toolsUsed: ["Docker Devcontainers", "WASM Micro-kernels", "Jest/PyTest Runners"],
    telemetryMetric: { label: "Test Coverage Requirement", value: ">= 85%" },
    codeMock: {
      filename: "project-submission.ts",
      code: `// Stage 3: Automated Project Suite Verification
export async function runAutomatedLabAudit(repoUrl: string): Promise<AuditResult> {
  const sandbox = await spinUpEphemeralContainer({ image: "ethio-node-postgres:latest" });
  const [unitTests, integrationTests, lintErrors] = await sandbox.runAll([
    "npm test -- --coverage",
    "npm run test:e2e",
    "npm run lint:strict"
  ]);

  return {
    passed: unitTests.coverage >= 85 && lintErrors.count === 0,
    earnedXP: 500,
    unlocksNextModule: true
  };
}`,
    },
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
      "Before any code merges, learners must pass rigorous peer review in their 4-6 engineer squad. Students review each other's pull requests, audit security vulnerabilities, and defend architectural trade-offs during weekly squad standups with a diaspora mentor.",
    keyDeliverables: [
      "At least 2 peer code approvals and 1 mentor architectural sign-off per feature",
      "Live 15-minute architectural defense presentation of system design choices",
      "Squad XP bonuses and peer reputation score boosts for helpful reviews",
    ],
    toolsUsed: ["EthioTech PR Reviewer", "Code Diff Heatmaps", "Squad Standup Bots"],
    telemetryMetric: { label: "Peer Code Reviews Completed", value: "112,000+" },
    codeMock: {
      filename: "pull-request-policy.ts",
      code: `// Stage 4: Squad PR Approval Gate
export const squadPRPolicy = {
  minPeerReviews: 2,
  requireArchitectureDefense: (moduleTier: string) => moduleTier === "CAPSTONE",
  autoRejectOnLinterWarning: true,
  rewardReviewerXP: (reviewerId: string) => ({
    reviewerXP: 75,
    reputationScoreBonus: 0.1
  })
};`,
    },
  },
  {
    step: 5,
    id: "verified-placement",
    title: "5. Verified Skill Passport & Career Placement",
    shortTitle: "5. Verified Placement",
    subtitle: "Tamper-proof credentials, proof-of-work portfolio & direct employer hiring",
    icon: Trophy,
    badge: "Direct Hiring Pipeline",
    overview:
      "Upon track completion and capstone defense, learners receive a cryptographically signed Skill Passport. This replaces traditional resumes with verifiable proof-of-work, granting immediate fast-track interviews with hiring partners across Ethiopia, Africa, and global remote engineering teams.",
    keyDeliverables: [
      "Cryptographically verified Skill Passport detailing verified competencies",
      "Live interactive portfolio featuring deployed apps and code playback timelines",
      "Direct fast-track interview referrals with vetted hiring partners (Zero recruiter fees)",
    ],
    toolsUsed: ["Talent Passport Verifier", "Employer Talent Directory", "Alumni Network"],
    telemetryMetric: { label: "Hiring Placement Rate", value: "88.2%" },
    codeMock: {
      filename: "skill-passport.ts",
      code: `// Stage 5: Cryptographically Verifiable Talent Passport
export interface VerifiableSkillPassport {
  passportId: "ETH-2026-8894";
  graduateName: "Helen Tadesse";
  certifiedTrack: "Fullstack Cloud Architecture";
  verifiedCompetencies: [
    "Distributed Microservices (Go/Node)",
    "PostgreSQL High-Concurrency Tuning",
    "Docker & Kubernetes CI/CD",
    "WebRTC Low-Latency Data Channels"
  ];
  githubCommitProof: "https://github.com/ethio-tech-proofs/helen-t";
  digitalSignature: "0x8f2a4e9b7c1d3e5f6a8b...";
}`,
    },
  },
];

// ─── Persona Breakdown Data ───
interface RolePersona {
  id: "student" | "mentor" | "employer";
  title: string;
  eyebrow: string;
  badge: string;
  icon: LucideIcon;
  description: string;
  keyBenefits: Array<{ title: string; desc: string; icon: LucideIcon }>;
  ctaLabel: string;
  ctaLink: string;
}

const ROLE_PERSONAS: RolePersona[] = [
  {
    id: "student",
    title: "The Student Experience",
    eyebrow: "For Aspiring Software Architects",
    badge: "100% Free Tuition",
    icon: GraduationCap,
    description:
      "Transform your career through structured tracks, hands-on production codebases, collaborative squads, and direct guidance from world-class diaspora engineers.",
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
    ctaLabel: "Apply as a Student",
    ctaLink: "/register",
  },
  {
    id: "mentor",
    title: "The Mentor Experience",
    eyebrow: "For Diaspora & Industry Tech Leads",
    badge: "Flexible 1-3 hrs/week",
    icon: Users,
    description:
      "Give back to Ethiopia's software ecosystem with maximum leverage. Share your expertise through structured office hours, PR reviews, and system design masterclasses.",
    keyBenefits: [
      {
        title: "High-Leverage Structured Format",
        desc: "Our platform automates scheduling and code review queues, letting you deliver outsized impact in just 1-3 hours weekly.",
        icon: Clock,
      },
      {
        title: "Empower Future Tech Leaders",
        desc: "Directly mentor high-potential Ethiopian engineers and help shape the next generation of African tech founders and architects.",
        icon: Sparkles,
      },
      {
        title: "Diaspora Engineering Network",
        desc: "Connect with fellow senior engineers, managers, and founders across Silicon Valley, Europe, and Pan-Africa.",
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
    eyebrow: "For Tech Companies & Enterprise Teams",
    badge: "Zero Placement Fees",
    icon: Award,
    description:
      "Hire vetted, production-ready software engineers with verified proof-of-work, production git histories, and strong teamwork habits.",
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
      "Yes, EthioTech is 100% free for all students. We do not charge tuition, registration fees, or income-share agreements (ISAs). We operate as an open-impact digital public good funded by diaspora philanthropy, educational grants, and non-extractive enterprise sponsorships.",
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
    question: "What are the requirements to become a diaspora or industry mentor?",
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
    <div className="min-h-screen text-[var(--text-primary)]">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 mb-4">
            <Sparkles size={12} />
            <span>The 5-Stage Engineering Engine</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl text-white">
            How aspiring engineers become <span className="text-indigo-400">production-ready</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
            From initial baseline calibration to low-latency diaspora pairing, sandbox development, squad code defense,
            and verified career placement. Explore the full architecture of how EthioTech works.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="md" className="font-medium">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                const el = document.getElementById("learner-lifecycle");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore the 5 Stages
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-zinc-400">
            {[
              "Sub-150ms WebRTC Labs",
              "Production Git PRs",
              "Squad Accountability",
              "Verifiable Passports",
              "Zero Tuition Fees",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-md border border-[#27272A] bg-[#0E0E11] px-2.5 py-1 text-zinc-300"
              >
                <Sparkles className="h-3 w-3 text-indigo-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Live Catalog Momentum Metrics */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#27272A] bg-[#0E0E11] p-4 text-center transition hover:border-zinc-700">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
              <Layers3 size={16} />
            </div>
            <p className="mt-2 text-xl font-bold text-white">{formatCompactNumber(tracks.length || 4)}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Core Tech Tracks</p>
            <p className="mt-0.5 text-xs text-zinc-400">Fullstack, AI, Cloud, Mobile</p>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-4 text-center transition hover:border-zinc-700">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
              <BookOpen size={16} />
            </div>
            <p className="mt-2 text-xl font-bold text-white">{formatCompactNumber(totalModules || 36)}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Interactive Modules</p>
            <p className="mt-0.5 text-xs text-zinc-400">Structured knowledge blocks</p>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-4 text-center transition hover:border-zinc-700">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
              <Code2 size={16} />
            </div>
            <p className="mt-2 text-xl font-bold text-white">{formatCompactNumber(totalLessons || 180)}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Hands-on Labs</p>
            <p className="mt-0.5 text-xs text-zinc-400">Real git repos & tests</p>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-4 text-center transition hover:border-zinc-700">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
              <Sparkles size={16} />
            </div>
            <p className="mt-2 text-xl font-bold text-white">{formatCompactNumber(totalXp || 24000)}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">XP Catalog</p>
            <p className="mt-0.5 text-xs text-zinc-400">Earned through verified PRs</p>
          </Card>
        </div>
      </motion.section>

      {/* ─── 5-Stage Interactive Learner Lifecycle ─── */}
      <section id="learner-lifecycle" className="border-t border-[#27272A] bg-[#050507] py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 mb-3">
              <span>Step-by-Step Flow</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">The 5-Stage Learner Lifecycle</h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
              Click through each stage to explore how we guide learners from diagnostic calibration to verified career
              placement.
            </p>
          </div>

          {/* Stepper Stage Selector */}
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-5 md:gap-3">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isActive = idx === activeStageIndex;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`group relative flex flex-col items-start rounded-lg border p-3.5 text-left transition-all duration-150 ${
                    isActive
                      ? "border-indigo-500/40 bg-indigo-500/15 text-white"
                      : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        isActive ? "bg-indigo-500 text-white" : "bg-[#141418] text-zinc-400"
                      }`}
                    >
                      {stage.step}
                    </span>
                    <Icon size={16} className={isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-white"} />
                  </div>
                  <p className="mt-2.5 text-xs font-semibold text-white line-clamp-1">{stage.shortTitle}</p>
                  <span className="mt-0.5 text-[10px] text-zinc-500">{stage.badge}</span>
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
                className="overflow-hidden rounded-xl border border-[#27272A] bg-[#0E0E11] shadow-lg"
              >
                <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-12 lg:items-center">
                  {/* Left: Narrative, Deliverables & Tools */}
                  <div className="space-y-4 lg:col-span-7">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="sm">
                          Stage {currentStage.step} of 5
                        </Badge>
                        <Badge variant="default" size="sm">
                          {currentStage.badge}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">{currentStage.title}</h3>
                      <p className="mt-0.5 text-xs font-medium text-indigo-400">{currentStage.subtitle}</p>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-400">{currentStage.overview}</p>

                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Key Deliverables & Milestones
                      </h4>
                      <ul className="mt-2 space-y-1.5">
                        {currentStage.keyDeliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Platform Tools:
                      </span>
                      {currentStage.toolsUsed.map((tool) => (
                        <span
                          key={tool}
                          className="rounded border border-[#27272A] bg-[#141418] px-2 py-0.5 text-[10px] text-zinc-400"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-[#27272A] bg-[#141418] p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                          {currentStage.telemetryMetric.label}
                        </p>
                        <p className="text-base font-bold text-white">{currentStage.telemetryMetric.value}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Code Simulation & Step Action */}
                  <div className="space-y-3 lg:col-span-5">
                    <div className="overflow-hidden rounded-lg border border-[#27272A] bg-black/60 shadow-inner">
                      <div className="flex items-center justify-between border-b border-[#27272A] bg-[#0E0E11] px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#27272A]" />
                          <span className="h-2 w-2 rounded-full bg-[#27272A]" />
                          <span className="h-2 w-2 rounded-full bg-[#27272A]" />
                          <span className="ml-2 text-xs font-mono text-zinc-500">{currentStage.codeMock.filename}</span>
                        </div>
                        <Badge variant="purple" size="sm">
                          Telemetry Live
                        </Badge>
                      </div>
                      <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed text-zinc-300">
                        <code>{currentStage.codeMock.code}</code>
                      </pre>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={activeStageIndex === 0}
                        onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                        className="text-zinc-400 hover:text-white disabled:opacity-30"
                      >
                        Previous Stage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveStageIndex((prev) => (prev + 1) % LIFECYCLE_STAGES.length)}
                        className="text-indigo-400 hover:text-white"
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
        className="mx-auto max-w-7xl px-4 py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 mb-3">
            <span>Ecosystem Experience</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">What It Looks Like For You</h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
            Explore how students, diaspora mentors, and hiring partners collaborate inside EthioTech.
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
                  className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
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
              className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-6 shadow-lg md:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {currentRoleData.eyebrow}
                  </span>
                  <h3 className="mt-0.5 text-xl font-bold text-white md:text-2xl">{currentRoleData.title}</h3>
                </div>
                <Badge variant="purple" size="md">
                  {currentRoleData.badge}
                </Badge>
              </div>

              <p className="mt-3 max-w-3xl text-xs leading-relaxed text-zinc-400">{currentRoleData.description}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {currentRoleData.keyBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.title}
                      className="flex items-start gap-3 rounded-lg border border-[#27272A] bg-[#141418] p-4 transition hover:border-zinc-700"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-white">{benefit.title}</h4>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <Link to={currentRoleData.ctaLink}>
                  <Button size="md">
                    {currentRoleData.ctaLabel} <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ─── Featured Track Pathways ─── */}
      <section className="border-t border-[#27272A] bg-[#050507] py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 mb-3">
              <span>Curriculum Architecture</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Choose Your Engineering Pathway
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
              Hyper-focused tracks designed to build the exact capabilities global and African employers demand.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
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
                  className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-6 transition-all duration-150 hover:border-zinc-700"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="purple" size="sm">
                        {moduleCount} Modules
                      </Badge>
                      <span className="flex items-center gap-1 text-xs font-semibold text-indigo-400">
                        <Sparkles size={12} /> {track.xpReward ?? 6000} XP
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-white">{track.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      {track.description || "Comprehensive hands-on curriculum with real project checkpoints."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#27272A]">
                    <Link to="/register">
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <span>Enroll in Track</span>
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
        className="mx-auto max-w-5xl px-4 py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 mb-3">
            <span>Got Questions?</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Frequently Asked Questions</h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
            Everything you need to know about our pedagogy, time requirements, mentorship, and certification.
          </p>

          {/* Search & Category Filter */}
          <div className="mt-8 space-y-3">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="text"
                placeholder="Search questions (e.g. internet, cost, mentor, hiring)..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#27272A] bg-[#0E0E11] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {(["all", "students", "mentors", "partners"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    faqCategory === cat
                      ? "border border-indigo-500 bg-indigo-600 text-white"
                      : "border border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
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
                  className="overflow-hidden border-[#27272A] bg-[#0E0E11] transition-all hover:border-zinc-700"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-white"
                  >
                    <span className="text-xs sm:text-sm font-semibold">{faq.question}</span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-indigo-400 transition-transform duration-150 ${
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
                        <div className="border-t border-[#27272A] px-4 pb-4 pt-2.5 text-xs leading-relaxed text-zinc-400">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No matching questions found. Try searching for something else.
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-24 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 shadow-lg">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400 mb-2.5">
                <span>Start Today</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Ready to accelerate your software engineering journey?
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Enroll in a track, meet your squad, and begin building production systems with real diaspora mentors.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button size="md" className="w-full sm:w-auto font-medium">
                  Join a Learning Track
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="md" className="w-full sm:w-auto">
                  See Learner Growth
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button variant="ghost" size="md" className="w-full sm:w-auto text-indigo-400 hover:text-white">
                  Explore Mentorship <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
