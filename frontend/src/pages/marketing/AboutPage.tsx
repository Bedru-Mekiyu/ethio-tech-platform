import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  Layers3,
  MapPin,
  MapPinned,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { MEDIA_CATEGORIES } from "@/config/mediaConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMarketingAbout, type MarketingAboutData } from "@/services/marketingService";
import { useQuery } from "@tanstack/react-query";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function AboutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Skeleton className="mx-auto h-6 w-48 rounded-full" />
        <Skeleton className="mx-auto mt-5 h-14 w-full max-w-4xl" />
        <Skeleton className="mx-auto mt-4 h-14 w-full max-w-3xl" />
        <Skeleton className="mx-auto mt-6 h-5 w-full max-w-2xl" />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-44 rounded-xl" />
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Skeleton className="h-52 rounded-[24px]" />
        <Skeleton className="h-52 rounded-[24px]" />
      </div>

      <div className="mt-20 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Skeleton className="aspect-[16/10] rounded-[28px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full max-w-[28rem]" />
          <Skeleton className="h-5 w-full max-w-[34rem]" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 rounded-[20px]" />
            <Skeleton className="h-20 rounded-[20px]" />
            <Skeleton className="h-20 rounded-[20px]" />
          </div>
        </div>
      </div>

      <Skeleton className="mt-20 h-40 w-full rounded-[28px]" />
      <Skeleton className="mt-20 h-96 w-full rounded-[28px]" />
    </div>
  );
}

interface PistelPillar {
  letter: "P" | "I" | "S" | "T" | "E" | "L" | "S2";
  shortKey: string;
  name: string;
  tagline: string;
  badge: string;
  icon: LucideIcon;
  philosophy: string;
  mechanisms: string[];
  keyMetric: { label: string; value: string };
  codeSnippet?: string;
}

const PISTELS_PILLARS: PistelPillar[] = [
  {
    letter: "P",
    shortKey: "practical",
    name: "Practical Architecture",
    tagline: "Zero toy code. Production pipelines from Day 1.",
    badge: "Day 1 Production",
    icon: Terminal,
    philosophy:
      "Ethiopian universities teach robust algorithm theory, but graduates encounter steep hurdles when required to configure CI/CD workflows, manage database migrations, or orchestrate Dockerized microservices. EthioTech replaces generic todo tutorials with distributed backends, resilient event loops, and production-grade pull requests.",
    mechanisms: [
      "Containerized devcontainers mirroring standard industry cloud setups",
      "Automated unit, integration, and end-to-end testing requirements for all project merges",
      "Live staging deployments on decentralized and edge compute nodes",
      "Real-world incident simulation labs (debugging latency spikes, memory leaks, concurrency locks)",
    ],
    keyMetric: { label: "Production PRs Merged", value: "48,000+" },
    codeSnippet: `// EthioTech Real Pipeline Validator
export async function verifyProductionDeploy(spec: ServiceSpec): Promise<PipelineStatus> {
  const [lintPass, testCoverage, secAudit] = await Promise.all([
    runStaticAnalyzer(spec.sourceDir),
    runCoverageReport(spec.testDir, { minThreshold: 85 }),
    runDependencyVulnerabilityScan(spec.packageLock)
  ]);
  return lintPass && testCoverage && secAudit ? "READY_FOR_DEPLOY" : "REJECTED";
}`,
  },
  {
    letter: "I",
    shortKey: "interactive",
    name: "Interactive & Low-Latency",
    tagline: "WebRTC live pairing & instant terminal execution.",
    badge: "Sub-150ms Latency",
    icon: Zap,
    philosophy:
      "Passive video lectures yield low completion rates globally. EthioTech pioneers synchronized collaborative IDEs and WebRTC multi-track audio optimized for regional 3G/4G bandwidths, enabling students across Ethiopia to pair-program live with tech leads across the globe with zero streaming lag.",
    mechanisms: [
      "Monaco editor with Operational Transformation (OT) conflict resolution",
      "Bandwidth-adaptive audio codecs streaming at under 48kbps",
      "In-browser WebAssembly micro-kernels for instant code execution",
      "Real-time code heatmaps highlighting peer syntax errors and test diffs",
    ],
    keyMetric: { label: "Avg Live Audio Latency", value: "< 120ms" },
    codeSnippet: `// WebRTC Audio + Operational Sync Engine
const rtcChannel = new DataChannelMesh({
  bandwidthMode: "ADAPTIVE_LOW_BANDWIDTH", // Optimized for regional telecom links
  audioBitrateKbps: 32,
  syncIntervalMs: 80,
  fallbackToTextDiffs: true
});`,
  },
  {
    letter: "S",
    shortKey: "squads",
    name: "Squads & Agile Cohorts",
    tagline: "4-6 engineer squads, daily standups, shared codebases.",
    badge: "Social Accountability",
    icon: Users,
    philosophy:
      "Software engineering is fundamentally a team discipline. Every learner is placed in a balanced 4-to-6 person squad spanning various Ethiopian regions. Squads simulate modern remote agile teams: managing Sprint Backlogs, conducting peer code audits, and rotating Scrum Master responsibilities.",
    mechanisms: [
      "Automated squad formation balancing skill levels, schedules, and language preferences",
      "Daily asynchronous standup synchronizers",
      "Peer pull request reviews required before mentor review unlock",
      "Collective squad XP bonuses unlocking hackathon entries and hardware access",
    ],
    keyMetric: { label: "Cohort Retention Rate", value: "91.4%" },
    codeSnippet: `// Squad Peer Review Gatekeeper
interface SquadReviewPolicy {
  minPeerApprovals: 2;
  mandatoryDiffInspection: true;
  mentorSignOffRequired: boolean;
  squadCohesionScoreMultiplier: 1.25;
}`,
  },
  {
    letter: "T",
    shortKey: "tracks",
    name: "Tech Tracks Tailored for African Scale",
    tagline: "Fullstack, AI Systems, Cloud DevOps, and Cross-Platform Mobile.",
    badge: "High-Demand Stacks",
    icon: Layers,
    philosophy:
      "Rather than generic computer science survey courses, EthioTech curates four hyper-focused vocational tracks matching the exact hiring demand of high-growth African startups, global remote contractors, and pan-African digital transformation initiatives.",
    mechanisms: [
      "Modern Cloud Fullstack: TypeScript, Next.js, Node.js, Go, PostgreSQL, Redis",
      "Applied AI & Machine Learning: Python, LLM Orchestration, PyTorch, Local Vector Stores",
      "Cloud Infrastructure & DevOps: Kubernetes, Docker, Terraform, CI/CD, Linux Systems",
      "Mobile First Engineering: Flutter, React Native, Offline-first SQLite sync, Mobile Money APIs",
    ],
    keyMetric: { label: "Active Curated Tracks", value: "4 Core + 12 Specializations" },
    codeSnippet: `// Dynamic Curriculum Progression
export const TRACK_MANIFEST = {
  FULLSTACK: { primary: "TypeScript", runtime: "Node/Go", db: "PostgreSQL" },
  AI_SYSTEMS: { primary: "Python", frameworks: ["PyTorch", "LangChain", "FastAPI"] },
  CLOUD_DEVOPS: { tooling: ["Docker", "Kubernetes", "GitHub Actions", "Terraform"] },
  MOBILE_SCALE: { framework: "Flutter", paymentIntegrations: ["Telebirr", "CBE Birr"] }
};`,
  },
  {
    letter: "E",
    shortKey: "equity",
    name: "Equity & Zero-Barrier Access",
    tagline: "100% tuition-free, offline sync, regional physical hubs.",
    badge: "Radical Inclusion",
    icon: ShieldCheck,
    philosophy:
      "Talent is evenly distributed across Ethiopia's 125 million citizens, but opportunity has historically concentrated in central Addis Ababa. EthioTech guarantees 100% free enrollment, offline sync capabilities, and hardware-backed physical hubs in regional university cities.",
    mechanisms: [
      "Zero tuition, zero upfront costs, zero debt contracts",
      "Offline-first progressive web architecture caching lessons and sandboxes",
      "Physical Hub network across Addis Ababa, Hawassa, Bahir Dar, Mekelle, Jimma, and Dire Dawa",
      "Data-saving ultra-compact mode cutting asset payloads by up to 88%",
    ],
    keyMetric: { label: "Tuition / Fee Cost", value: "$0 Always" },
    codeSnippet: `// Offline PWA Sync Engine
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/offline-mesh-worker.js', {
      scope: '/curriculum/'
    });
  });
}`,
  },
  {
    letter: "L",
    shortKey: "mentorship",
    name: "Live Mentorship by Diaspora Tech Leads",
    tagline: "1-on-1 office hours & architectural reviews with industry veterans.",
    badge: "Global Diaspora Bridge",
    icon: Globe,
    philosophy:
      "The Ethiopian tech diaspora holds world-class expertise across Silicon Valley, Europe, and multinational enterprises. EthioTech provides a structured platform allowing diaspora engineers to mentor cohorts, run mock interviews, and review code with 2-3 hours of weekly commitment.",
    mechanisms: [
      "Structured 30-minute 1-on-1 code review and architectural office hours",
      "System design masterclasses taught by Staff & Principal engineers",
      "Reverse mentorship: Diaspora leads stay connected with grassroots Ethiopian innovations",
      "Verified mentor credentialing and alumni endorsement badges",
    ],
    keyMetric: { label: "Global Mentor Network", value: "250+ Engineers" },
    codeSnippet: `// 1-on-1 Mentor Slot Booking Matcher
export function matchLearnerToMentor(learnerGoal: string, mentorExpertise: string[]) {
  return mentorDirectory.filter(mentor => 
    mentor.isVerified && mentor.expertise.includes(learnerGoal) && mentor.availableSlots > 0
  );
}`,
  },
  {
    letter: "S2",
    shortKey: "sustainable",
    name: "Sustainable Career Outcomes",
    tagline: "Verifiable skill passports, proof-of-work, direct hiring pipelines.",
    badge: "Verified Employment",
    icon: Trophy,
    philosophy:
      "Traditional diplomas are opaque proxies for skill. EthioTech replaces paper certificates with public, verifiable Skill Passports backed by actual GitHub commit histories, recorded architectural defenses, and direct enterprise talent matching with zero recruitment fees.",
    mechanisms: [
      "Cryptographically signed talent passports verifiable by any global employer",
      "Public showcase portfolios featuring live deployed projects and code playback",
      "Direct fast-track interview pipelines with hiring partners across Ethiopia and remote global firms",
      "Continuous alumni career leveling, salary benchmarking, and leadership advancement",
    ],
    keyMetric: { label: "Graduates Placed in Tech", value: "88.2%" },
    codeSnippet: `// Verifiable Proof-of-Work Credential
export interface SkillPassport {
  learnerId: string;
  verifiedTracks: string[];
  cumulativeXP: number;
  gitHubCommitEvidence: string[];
  architecturalDefenseScore: number;
  digitalSignature: string;
}`,
  },
];

const ETHIOPIAN_DEMOGRAPHIC_FACTS = [
  {
    metric: "70%+",
    label: "Youth Population",
    description: "Over 90 million Ethiopians are under 30 years old, representing Africa's fastest-growing demographic dividend.",
    icon: Users,
  },
  {
    metric: "100k+",
    label: "Annual STEM Graduates",
    description: "50+ public universities graduate tens of thousands of engineers annually, yet face critical shortage of practical labs.",
    icon: GraduationCap,
  },
  {
    metric: "14+",
    label: "Regional Universities Linked",
    description: "Bridging the regional digital divide between Addis Ababa and universities in Hawassa, Jimma, Bahir Dar, Mekelle, and Dire Dawa.",
    icon: MapPinned,
  },
  {
    metric: "$0",
    label: "Tuition or Subscription Fees",
    description: "Fully subsidized non-profit model guaranteeing equal access to all students regardless of economic background.",
    icon: Users,
  },
];

const REGIONAL_DIVIDE_SOLUTIONS = [
  {
    title: "1. Edge-Optimized & Offline Sync",
    subtitle: "Built for resilient regional connectivity",
    description:
      "Our platform uses an ultra-compact lightweight protocol and ServiceWorker caching. Interactive exercises run in in-browser WASM sandbox environments, allowing students to learn even during intermittent network drops.",
    icon: Radio,
    tag: "Offline First",
  },
  {
    title: "2. Physical Hub Mesh Network",
    subtitle: "Safe spaces with power, fast fiber & workstations",
    description:
      "We partner with regional tech centers and universities to host dedicated EthioTech Learning Hubs equipped with backup power, high-speed fiber internet, and collaborative hardware setups.",
    icon: Building2Icon,
    tag: "Physical Mesh",
  },
  {
    title: "3. Global Ethiopian Diaspora Bridge",
    subtitle: "World-class mentorship delivered locally",
    description:
      "Over 250 Ethiopian tech leaders working at Google, Microsoft, Amazon, Safaricom, and African unicorns conduct weekly live reviews, bridging local talent to global engineering standards.",
    icon: Layers3,
    tag: "Mentorship",
  },
  {
    title: "4. Open-Source Production Repositories",
    subtitle: "No toy code, only verifiable proof-of-work",
    description:
      "All projects are maintained as open-source codebases with full git histories, automated CI test suites, and live staging URLs that serve as definitive proof of competence for employers.",
    icon: FileCodeIcon,
    tag: "Proof of Work",
  },
];

function Building2Icon(props: { size?: number; className?: string }) {
  return <MapPin {...props} />;
}

function FileCodeIcon(props: { size?: number; className?: string }) {
  return <Code2 {...props} />;
}

interface RoadmapMilestone {
  phase: string;
  year: string;
  status: "completed" | "in-progress" | "planned";
  title: string;
  description: string;
  deliverables: string[];
}

const ROADMAP_DATA: RoadmapMilestone[] = [
  {
    phase: "Phase 1",
    year: "2024",
    status: "completed",
    title: "Genesis & Core Realtime Engine",
    description:
      "Architected the foundational WebRTC classroom, real-time collaboration engine, and launched our initial 4 tracks across pilot cohorts in Addis Ababa and Hawassa.",
    deliverables: [
      "WebRTC audio mesh with sub-150ms latency",
      "Initial 4 curriculum tracks with 150+ interactive lessons",
      "5,000+ registered learners & 80+ diaspora mentors onboarded",
      "Pilot regional hub established in Hawassa",
    ],
  },
  {
    phase: "Phase 2",
    year: "2025",
    status: "completed",
    title: "Regional Mesh & Physical Hub Network",
    description:
      "Expanded physical hubs into 6 regional capitals, introduced offline-first PWA sync, and built our automated squad matchmaking algorithm.",
    deliverables: [
      "Physical Hub mesh launched in Bahir Dar, Jimma, Mekelle, and Dire Dawa",
      "Squad matchmaking engine with asynchronous standup bots",
      "Talent Passport credentialing with cryptographic tamper-proofing",
      "Over 18,000 active learners and 88% project completion rate",
    ],
  },
  {
    phase: "Phase 3",
    year: "2026",
    status: "in-progress",
    title: "AI Co-Pilot & WebAssembly Sandbox Labs",
    description:
      "Embedding localized AI architectural review assistants, in-browser WebAssembly Linux micro-containers, and hosting the largest Pan-African collegiate hackathons.",
    deliverables: [
      "In-browser container sandboxes with real-time git integration",
      "AI Code Co-Pilot tuned specifically for student syntax diagnostics",
      "Pan-Ethiopian University Hackathon with 100+ competing squads",
      "Direct employer talent matching portal with zero recruitment fees",
    ],
  },
  {
    phase: "Phase 4",
    year: "2027+",
    status: "planned",
    title: "Sovereign African Talent Cloud & Pan-Continental Mesh",
    description:
      "Scaling the PISTELS framework across East Africa, launching decentralized edge learning nodes, and partnering with 200+ global enterprises for direct hiring pipelines.",
    deliverables: [
      "Expansion into Kenya, Rwanda, and Uganda regional university networks",
      "Decentralized student credential verification on open public ledger",
      "100,000+ certified production-ready software engineers placed globally",
      "Fully self-sustaining open-impact endowment funded by diaspora philanthropy",
    ],
  },
];

export function AboutPage() {
  const reduceMotion = useReducedMotion();
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);
  const [roadmapFilter, setRoadmapFilter] = useState<"all" | "completed" | "in-progress" | "planned">("all");

  const { data, isLoading, isError, error, refetch } = useQuery<MarketingAboutData>({
    queryKey: ["marketing", "about"],
    queryFn: fetchMarketingAbout,
  });

  if (isLoading) {
    return <AboutSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load the about page right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const activePillar = PISTELS_PILLARS[activePillarIndex] || PISTELS_PILLARS[0];

  const filteredRoadmap = ROADMAP_DATA.filter((item) => {
    if (roadmapFilter === "all") return true;
    return item.status === roadmapFilter;
  });

  const stats = [
    {
      icon: Users,
      value: formatCompactCount(data?.stats.activeLearners ?? 18450),
      label: "Active Learners",
      helper: "Across 14 Ethiopian regions",
      tone: "primary" as const,
    },
    {
      icon: Globe,
      value: formatCompactCount(data?.stats.mentorNetwork ?? 250),
      label: "Diaspora Mentors",
      helper: "Engineering leaders worldwide",
      tone: "purple" as const,
    },
    {
      icon: Layers3,
      value: formatCompactCount(data?.stats.trackCount ?? 4),
      label: "Core Stacks",
      helper: "Fullstack, AI, Cloud, Mobile",
      tone: "success" as const,
    },
    {
      icon: ShieldCheck,
      value: `${data?.stats.approvalRate ?? 88}%`,
      label: "PR Approval Rate",
      helper: "Rigorous code review standards",
      tone: "warning" as const,
    },
  ];

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        {/* Subtle glow background */}
        <div className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-80 w-full max-w-3xl -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="default" size="md" showDot className="mb-4">
            The Ethiopian Software Engineering Movement
          </Badge>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Democratizing elite tech education with the{" "}
            <span className="text-primary">
              PISTELS
            </span>{" "}
            framework
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
            {data?.hero.description ||
              "EthioTech is a non-profit educational platform bridging the chasm between academic theory and software engineering. Powered by the global Ethiopian diaspora, low-latency live sandboxes, and squad-based accountability, we empower Ethiopia's next generation of software architects."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link to="/register">
              <Button size="lg" className="bg-primary text-black font-bold">
                Join as Student <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button variant="outline" size="lg" className="border-slate-800 bg-slate-900/60 hover:border-slate-700 text-white">
                <Users className="mr-2 h-4 w-4 text-primary" /> Become a Mentor
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                const el = document.getElementById("pistels-framework");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-[var(--text-secondary)] hover:text-white"
            >
              Explore PISTELS Ideology
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-[var(--text-secondary)]">
            {(data?.hero.highlights ?? [
              "100% Free & Open Source",
              "WebRTC Sub-150ms Live Labs",
              "Diaspora Mentor Network",
              "Offline-First Mesh Sync",
              "Verifiable Proof-of-Work",
            ]).map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── Platform High-Impact Stats ─── */}
      <section className="px-4 py-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden border-slate-800 bg-slate-900/70 p-5 transition-all duration-200 hover:border-slate-700"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight text-white">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">{stat.label}</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-[var(--text-secondary)]">{stat.helper}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── The Ethiopian Demographic Context & Challenge ─── */}
      <motion.section
        className="mx-auto max-w-7xl px-4 py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md" showDot className="mb-3">
            National Context & Strategic Imperative
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Unlocking Ethiopia’s <span className="glow-text text-primary">Demographic Dividend</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
            With over 125 million citizens and 70% under the age of 30, Ethiopia holds immense engineering potential.
            EthioTech provides the production-grade tooling and mentorship needed to bridge academic theory with industry demands.
          </p>
        </div>

        {/* Demographic Facts Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETHIOPIAN_DEMOGRAPHIC_FACTS.map((fact) => {
            const Icon = fact.icon;
            return (
              <Card
                key={fact.label}
                className="border-slate-800 bg-slate-900/60 p-5 transition duration-200 hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                  <Icon size={18} />
                </div>
                <p className="mt-3.5 text-2xl font-extrabold text-white">{fact.metric}</p>
                <h3 className="mt-1 text-sm font-semibold text-white">{fact.label}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{fact.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Regional Divide vs Scaled Solution */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center gap-2.5 text-rose-400">
                <Flame size={20} />
                <h3 className="text-lg font-bold text-white">The Theory vs. Practice Chasm</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                Most university students graduate having completed blackboard algorithms and single-page textbook
                projects. Real software engineering requires git branching workflows, automated CI/CD pipelines,
                Docker containers, and high-availability system architecture.
              </p>
              <div className="mt-3.5 space-y-2 text-xs text-[var(--text-secondary)]">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>Academic labs lack continuous deployment and cloud credits.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>Regional universities face sporadic connectivity and isolated cohorts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>Graduates lack verifiable proof-of-work repositories for hiring teams.</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <ShieldCheck size={20} />
                <h3 className="text-lg font-bold text-white">How EthioTech Solves This</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                EthioTech provides a continuous software development lifecycle right in the browser and across
                our physical regional hubs. Students push real code, receive automated CI test feedback in
                seconds, and review code with senior mentors.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <Badge variant="success" size="sm">100% Practical Labs</Badge>
                <Badge variant="success" size="sm">Automated CI Pipelines</Badge>
                <Badge variant="success" size="sm">Production Git Pull Requests</Badge>
                <Badge variant="success" size="sm">Verifiable Skill Passports</Badge>
              </div>
            </div>
          </div>

          {/* Regional Solutions Cards */}
          <div className="space-y-3.5">
            <h3 className="text-lg font-bold text-white">Overcoming the Regional Digital Divide</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              We design specifically for Ethiopian infrastructure, ensuring learners in every region
              enjoy an uncompromising learning experience.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGIONAL_DIVIDE_SOLUTIONS.map((sol) => {
                const Icon = sol.icon;
                return (
                  <Card
                    key={sol.title}
                    className="border-slate-800 bg-slate-900/60 p-4 transition-all duration-200 hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-primary border border-slate-700">
                        <Icon size={16} />
                      </div>
                      <Badge variant="default" size="sm">
                        {sol.tag}
                      </Badge>
                    </div>
                    <h4 className="mt-2.5 text-xs font-semibold text-white">{sol.title}</h4>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{sol.subtitle}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{sol.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── The PISTELS Framework (Core Pedagogical Backbone) ─── */}
      <section id="pistels-framework" className="relative border-y border-slate-800 bg-slate-950/40 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" size="md" showDot className="mb-3">
              Core Pedagogical Backbone
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              The <span className="text-primary">PISTELS</span>{" "}
              Ideology
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
              Our 7-pillar methodology engineered to systematically develop collaborative software engineers
              capable of shipping at high technical standards.
            </p>
          </div>

          {/* Letter Navigation Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {PISTELS_PILLARS.map((pillar, idx) => {
              const isActive = idx === activePillarIndex;
              return (
                <button
                  key={pillar.shortKey}
                  type="button"
                  onClick={() => setActivePillarIndex(idx)}
                  className={`group relative flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-primary/15 text-white shadow-md shadow-primary/10"
                      : "border-slate-800 bg-slate-900/60 text-[var(--text-secondary)] hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-black ${
                      isActive ? "bg-primary text-black" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {pillar.letter === "S2" ? "S" : pillar.letter}
                  </span>
                  <span className="hidden sm:inline text-xs">{pillar.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Deep-Dive Display */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillar.shortKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl"
              >
                <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-12 lg:items-center">
                  {/* Left Column: Narrative & Mechanisms */}
                  <div className="space-y-5 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                        <activePillar.icon size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            Pillar {activePillarIndex + 1} of 7
                          </span>
                          <Badge variant="default" size="sm">
                            {activePillar.badge}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-extrabold text-white md:text-2xl">{activePillar.name}</h3>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-primary">{activePillar.tagline}</p>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{activePillar.philosophy}</p>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        Core Architecture & Mechanics
                      </h4>
                      <ul className="mt-2.5 space-y-2">
                        {activePillar.mechanisms.map((mech) => (
                          <li key={mech} className="flex items-start gap-2.5 text-xs text-slate-200">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span>{mech}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Trophy size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{activePillar.keyMetric.label}</p>
                        <p className="text-lg font-bold text-white">{activePillar.keyMetric.value}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Code & Interactive Architecture */}
                  <div className="space-y-3 lg:col-span-5">
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-black/80 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3.5 py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                          <span className="ml-2 text-xs font-mono text-[var(--text-muted)]">
                            {activePillar.shortKey}-architecture.ts
                          </span>
                        </div>
                        <Badge variant="default" size="sm">
                          PISTELS Spec
                        </Badge>
                      </div>
                      <pre className="overflow-x-auto p-3.5 text-xs font-mono leading-relaxed text-slate-300">
                        <code>{activePillar.codeSnippet}</code>
                      </pre>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span>Click any pillar above to inspect mechanics</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActivePillarIndex((prev) => (prev + 1) % PISTELS_PILLARS.length);
                        }}
                        className="text-primary hover:text-white"
                      >
                        Next Pillar <ArrowRight size={13} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* All 7 Pillars Grid Summary */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PISTELS_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isSelected = idx === activePillarIndex;
              return (
                <Card
                  key={pillar.shortKey}
                  onClick={() => setActivePillarIndex(idx)}
                  className={`cursor-pointer border p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-primary border border-slate-700">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold font-mono text-primary">
                      {pillar.letter === "S2" ? "S" : pillar.letter}
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-white">{pillar.name}</h4>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">{pillar.tagline}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Mission, Vision & Community Bridge ─── */}
      <motion.section
        className="mx-auto max-w-7xl px-4 py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900/70 p-6 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                <Target size={22} />
              </div>
              <Badge variant="default">Our Purpose</Badge>
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">{data?.mission.title ?? "Our Mission"}</h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {data?.mission.description ??
                "To democratize software engineering education for every Ethiopian youth through free, open, and production-grade experiential learning, powered by low-latency tooling and global diaspora mentorship."}
            </p>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-6 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                <Compass size={22} />
              </div>
              <Badge variant="default">Our Horizon</Badge>
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">{data?.vision.title ?? "Our Vision"}</h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {data?.vision.description ??
                "To establish Ethiopia as Africa's preeminent sovereign software and artificial intelligence talent powerhouse, placing 100,000+ certified engineers into high-growth pan-African companies and global distributed engineering teams by 2030."}
            </p>
          </Card>
        </div>

        {/* Visual Community Showcase */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-800 shadow-xl">
              <SmartImage
                unsplashId={MEDIA_CATEGORIES.marketing.hero[1].unsplashId}
                alt="EthioTech immersive learning environment preview - student programmer at work"
                hoverEffect="glow"
                wrapperClassName="h-full w-full border-none bg-transparent rounded-2xl overflow-hidden"
                className="h-full w-full object-cover"
                width={1000}
                quality={85}
              />
            </div>
          </div>

          <div>
            <Badge variant="default" size="sm" className="mb-2">
              National Impact Model
            </Badge>
            <h3 className="text-2xl font-bold leading-tight md:text-3xl text-white">{data?.bridge.title ?? "Bridging the Gap from Campus to Cloud"}</h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              {data?.bridge.description ??
                "EthioTech operates as an open-impact digital public good. We bridge the structural divide by linking university classrooms directly to diaspora tech leads and production codebases."}
            </p>

            <div className="mt-5 space-y-2.5">
              {(data?.bridge.bullets ?? [
                "Zero-cost access: No tuition, no upfront fees, and no income-share agreements.",
                "Live pair programming with diaspora leads at top global tech companies.",
                "Physical Regional Hubs with reliable power and internet across 6 university cities.",
              ]).map((bullet, index) => {
                const icons = [Sparkles, ShieldCheck, MapPinned];
                const Icon = icons[index] ?? Sparkles;
                return (
                  <div
                    key={bullet}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition hover:border-slate-700"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={15} />
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{bullet}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/how-it-works">
                <Button variant="outline" size="sm" className="border-slate-800 text-white hover:border-primary">
                  See the 5-Stage Journey <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
              <Link to="/hubs">
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  Explore Regional Hubs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Interactive Roadmap & Milestones ─── */}
      <motion.section
        className="mx-auto max-w-6xl px-4 py-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="default" size="md" showDot className="mb-3">
            Trajectory & Execution
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Platform Roadmap & Milestones</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Our multi-year blueprint scaling Ethiopia's digital software engineering infrastructure.
          </p>

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {(["all", "completed", "in-progress", "planned"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setRoadmapFilter(filterKey)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  roadmapFilter === filterKey
                    ? "bg-primary text-black"
                    : "border border-slate-800 bg-slate-900/60 text-[var(--text-secondary)] hover:border-slate-700 hover:text-white"
                }`}
              >
                {filterKey === "all" ? "All Phases" : filterKey.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {filteredRoadmap.map((item) => {
            const statusConfig = {
              completed: { badge: "Completed", variant: "success" as const, dotColor: "bg-emerald-400" },
              "in-progress": { badge: "Current Phase", variant: "default" as const, dotColor: "bg-primary animate-pulse" },
              planned: { badge: "Planned", variant: "default" as const, dotColor: "bg-slate-400" },
            }[item.status];

            return (
              <Card
                key={item.phase}
                className="overflow-hidden border-slate-800 bg-slate-900/70 p-6 transition-all duration-200 hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotColor}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">{item.phase}</span>
                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.badge}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">{item.year}</span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{item.description}</p>

                <div className="mt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Key Deliverables & Milestones
                  </h4>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    {item.deliverables.map((deliv) => (
                      <div key={deliv} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.section>

      {/* ─── Governance, Transparency & Open Impact Model ─── */}
      <section className="border-t border-slate-800 bg-slate-950/40 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" size="md" showDot className="mb-3">
              Institutional Trust
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Governance & Open Impact Model
            </h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              EthioTech is operated as a transparent, non-profit digital public good dedicated to long-term national
              capacity building.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border-slate-800 bg-slate-900/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                <BookOpen size={20} />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-white">100% Open Source Syllabus</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                All curriculum outlines, project boilerplate repositories, and testing suites are published under open
                permissive licenses (MIT / CC-BY-4.0). Any university or student can inspect or fork improvements.
              </p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                <ShieldCheck size={20} />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-white">Ethical Philanthropic Model</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                We operate free from extractive investor incentives. Funding is derived exclusively from diaspora tech
                philanthropy, educational grants, and CSR partnerships. No student is ever charged tuition.
              </p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-primary border border-slate-700">
                <ShieldCheck size={20} />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-white">Transparent Impact Auditing</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                We maintain a telemetry reporting system documenting active cohorts, PR merge volumes, mentor
                volunteer hours, and verified career placements. Every metric is audited and verifiable.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-20 pt-8 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden border-slate-800 bg-slate-900/80 p-8 md:p-12 shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge variant="default" size="sm" className="mb-3">
                Join the Movement
              </Badge>
              <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                Ready to transform your engineering trajectory?
              </h2>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                Whether you are a university student eager to build production systems or a seasoned diaspora engineer
                ready to guide the next generation, EthioTech is your platform.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-black font-bold">
                  Join as Student
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 text-white hover:border-primary">
                  Become a Mentor
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-primary hover:bg-primary/10">
                  Explore Learning Flow <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
