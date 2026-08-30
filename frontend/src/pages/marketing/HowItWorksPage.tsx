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
        <div className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-secondary/10 blur-[120px]" />

        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="purple" size="md" showDot className="mb-4">
            The 5-Stage Engineering Engine
          </Badge>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            How aspiring engineers become{" "}
            <span className="text-primary">
              production-ready
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
            From initial baseline calibration to low-latency diaspora pairing, sandbox development, squad code defense,
            and verified career placement. Explore the full architecture of how EthioTech works.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="shadow-lg shadow-primary/20">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById("learner-lifecycle");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="border-primary/40 hover:bg-primary/10"
            >
              Explore the 5 Stages
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs text-[var(--text-secondary)]">
            {[
              "Sub-150ms WebRTC Labs",
              "Production Git PRs",
              "Squad Accountability",
              "Verifiable Passports",
              "Zero Tuition Fees",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
              >
                <Sparkles className="h-3 w-3 text-secondary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Live Catalog Momentum Metrics */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center transition hover:border-primary/40">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers3 size={20} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{formatCompactNumber(tracks.length || 4)}</p>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Core Tech Tracks</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Fullstack, AI, Cloud, Mobile</p>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center transition hover:border-secondary/40">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <BookOpen size={20} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{formatCompactNumber(totalModules || 36)}</p>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Interactive Modules</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Structured knowledge blocks</p>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center transition hover:border-success/40">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <Code2 size={20} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{formatCompactNumber(totalLessons || 180)}</p>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Hands-on Labs</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Real git repos & tests</p>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center transition hover:border-warning/40">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Sparkles size={20} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{formatCompactNumber(totalXp || 24000)}</p>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">XP Catalog</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Earned through verified PRs</p>
          </Card>
        </div>
      </motion.section>

      {/* ─── 5-Stage Interactive Learner Lifecycle ─── */}
      <section id="learner-lifecycle" className="border-t border-white/10 bg-white/[0.015] py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" size="md" showDot className="mb-3">
              Step-by-Step Flow
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              The 5-Stage Learner Lifecycle
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
              Click through each stage to explore how we guide learners from diagnostic calibration to verified career
              placement.
            </p>
          </div>

          {/* Stepper Stage Selector */}
          <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-5 md:gap-3">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isActive = idx === activeStageIndex;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-white/10 bg-[var(--bg-card)]/80 hover:border-white/25 hover:bg-white/5"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black ${
                        isActive ? "bg-primary text-black" : "bg-white/10 text-[var(--text-secondary)]"
                      }`}
                    >
                      {stage.step}
                    </span>
                    <Icon
                      size={18}
                      className={isActive ? "text-primary" : "text-[var(--text-muted)] group-hover:text-white"}
                    />
                  </div>
                  <p className="mt-3 text-xs font-bold text-white line-clamp-1">{stage.shortTitle}</p>
                  <span className="mt-1 text-[10px] text-[var(--text-muted)]">{stage.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Breakdown */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-primary/25 bg-[var(--bg-card)]/95 shadow-2xl backdrop-blur-xl"
              >
                <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-12 lg:items-center">
                  {/* Left: Narrative, Deliverables & Tools */}
                  <div className="space-y-6 lg:col-span-7">
                    <div>
                      <div className="flex items-center gap-3">
                        <Badge variant="purple" size="sm">
                          Stage {currentStage.step} of 5
                        </Badge>
                        <Badge variant="default" size="sm">
                          {currentStage.badge}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-2xl font-extrabold text-white md:text-3xl">{currentStage.title}</h3>
                      <p className="mt-1 text-sm font-medium text-primary">{currentStage.subtitle}</p>
                    </div>

                    <p className="text-sm leading-7 text-[var(--text-secondary)]">{currentStage.overview}</p>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        Key Deliverables & Milestones
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {currentStage.keyDeliverables.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Platform Tools:
                      </span>
                      {currentStage.toolsUsed.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                          {currentStage.telemetryMetric.label}
                        </p>
                        <p className="text-xl font-bold text-white">{currentStage.telemetryMetric.value}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Code Simulation & Step Action */}
                  <div className="space-y-4 lg:col-span-5">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-inner">
                      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-red-500/80" />
                          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                          <span className="h-3 w-3 rounded-full bg-green-500/80" />
                          <span className="ml-2 text-xs font-mono text-[var(--text-muted)]">
                            {currentStage.codeMock.filename}
                          </span>
                        </div>
                        <Badge variant="purple" size="sm">
                          Telemetry Live
                        </Badge>
                      </div>
                      <pre className="overflow-x-auto p-4 text-xs font-mono leading-6 text-cyan-200/90">
                        <code>{currentStage.codeMock.code}</code>
                      </pre>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={activeStageIndex === 0}
                        onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                        className="text-[var(--text-secondary)] hover:text-white disabled:opacity-30"
                      >
                        Previous Stage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setActiveStageIndex((prev) => (prev + 1) % LIFECYCLE_STAGES.length)
                        }
                        className="text-primary hover:text-white"
                      >
                        {activeStageIndex === LIFECYCLE_STAGES.length - 1 ? "Replay Lifecycle" : "Next Stage"}
                        <ArrowRight size={14} className="ml-1" />
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
        className="mx-auto max-w-7xl px-4 py-20 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="purple" size="md" showDot className="mb-3">
            Ecosystem Experience
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">What It Looks Like For You</h2>
          <p className="mt-4 text-base text-[var(--text-secondary)]">
            Explore how students, diaspora mentors, and hiring partners collaborate inside EthioTech.
          </p>

          {/* Role Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ROLE_PERSONAS.map((persona) => {
              const isActive = persona.id === activeRole;
              const Icon = persona.icon;
              return (
                <button
                  key={persona.id}
                  onClick={() => setActiveRole(persona.id)}
                  className={`flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? "border-primary bg-primary text-black shadow-lg shadow-primary/20"
                      : "border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span>{persona.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Card Breakdown */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoleData.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-[var(--bg-card)]/90 p-8 shadow-xl md:p-10"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {currentRoleData.eyebrow}
                  </span>
                  <h3 className="mt-1 text-2xl font-extrabold text-white md:text-3xl">{currentRoleData.title}</h3>
                </div>
                <Badge variant="purple" size="md">
                  {currentRoleData.badge}
                </Badge>
              </div>

              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                {currentRoleData.description}
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {currentRoleData.keyBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.title}
                      className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition hover:border-primary/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{benefit.title}</h4>
                        <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <Link to={currentRoleData.ctaLink}>
                  <Button size="lg" className="shadow-lg shadow-primary/20">
                    {currentRoleData.ctaLabel} <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ─── Featured Track Pathways ─── */}
      <section className="border-t border-white/10 bg-white/[0.01] py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" size="md" showDot className="mb-3">
              Curriculum Architecture
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Choose Your Engineering Pathway</h2>
            <p className="mt-4 text-base text-[var(--text-secondary)]">
              Hyper-focused tracks designed to build the exact capabilities global and African employers demand.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
            ).map((track) => (
              <Card
                key={track._id || track.title}
                className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="purple" size="sm">
                      {("modules" in track && Array.isArray((track as any).modules) ? (track as any).modules.length : (track as any).moduleCount ?? 6)} Modules
                    </Badge>
                    <span className="flex items-center gap-1 text-xs font-bold text-primary">
                      <Sparkles size={13} /> {track.xpReward ?? 6000} XP
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">{track.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
                    {track.description || "Comprehensive hands-on curriculum with real project checkpoints."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <Link to="/register">
                    <Button variant="outline" className="w-full justify-between">
                      Enroll in Track <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Interactive Filterable FAQ ─── */}
      <motion.section
        className="mx-auto max-w-5xl px-4 py-20 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="purple" size="md" showDot className="mb-3">
            Got Questions?
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Frequently Asked Questions</h2>
          <p className="mt-4 text-base text-[var(--text-secondary)]">
            Everything you need to know about our pedagogy, time requirements, mentorship, and certification.
          </p>

          {/* Search & Category Filter */}
          <div className="mt-8 space-y-4">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="text"
                placeholder="Search questions (e.g. internet, cost, mentor, hiring)..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-xs text-white placeholder-[var(--text-muted)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(["all", "students", "mentors", "partners"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                    faqCategory === cat
                      ? "bg-primary text-black"
                      : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  {cat === "all" ? "All Questions" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-12 space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <Card
                  key={faq.question}
                  className="overflow-hidden border-[var(--border)] bg-[var(--bg-card)]/90 transition-all hover:border-primary/30"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left text-white"
                  >
                    <span className="text-base font-bold">{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-primary transition-transform duration-200 ${
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
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-white/5 px-5 pb-5 pt-3 text-sm leading-7 text-[var(--text-secondary)]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              No matching questions found. Try searching for something else.
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-24 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden border-primary/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))] p-8 md:p-12 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="default" size="sm" className="mb-3">
                Start Today
              </Badge>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                Ready to accelerate your software engineering journey?
              </h2>
              <p className="mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
                Enroll in a track, meet your squad, and begin building production systems with real diaspora mentors.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
                  Join a Learning Track
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See Learner Growth
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto text-primary hover:bg-primary/10 hover:text-primary"
                >
                  Explore Mentorship <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
