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
  Target,
  Terminal,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
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
      "Ethiopian universities teach robust algorithm theory, but graduates encounter steep hurdles when required to configure CI/CD workflows, manage database migrations, or orchestrate Dockerized microservices. EthioTech replaces generic tutorials with distributed backends, resilient event loops, and production-grade pull requests.",
    mechanisms: [
      "Containerized devcontainers mirroring standard industry cloud setups",
      "Automated unit, integration, and end-to-end testing requirements for all project merges",
      "Live staging deployments on edge compute nodes",
      "Real-world incident simulation labs (debugging latency, indexing, concurrency locks)",
    ],
    keyMetric: { label: "Engineering Standard", value: "Production PR Reviews & CI" },
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
    keyMetric: { label: "Live Lab Latency Target", value: "Sub-150ms WebRTC" },
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
    keyMetric: { label: "Collaboration Model", value: "4-to-6 Engineer Agile Squads" },
  },
  {
    letter: "T",
    shortKey: "tracks",
    name: "Tech Tracks Tailored for African Scale",
    tagline: "Fullstack, AI Systems, Cloud DevOps, and Cross-Platform Mobile.",
    badge: "High-Demand Stacks",
    icon: Layers,
    philosophy:
      "Rather than generic computer science survey courses, EthioTech curates hyper-focused vocational tracks matching the exact hiring demand of high-growth African startups, global remote contractors, and pan-African digital transformation initiatives.",
    mechanisms: [
      "Modern Cloud Fullstack: TypeScript, Next.js, Node.js, Go, PostgreSQL, Redis",
      "Applied AI & Machine Learning: Python, LLM Orchestration, PyTorch, Local Vector Stores",
      "Cloud Infrastructure & DevOps: Kubernetes, Docker, Terraform, CI/CD, Linux Systems",
      "Mobile First Engineering: Flutter, React Native, Offline-first SQLite sync, Mobile Money APIs",
    ],
    keyMetric: { label: "Curriculum Pathways", value: "6 High-Demand Tech Tracks" },
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
    keyMetric: { label: "Tuition / Cost", value: "$0 100% Free Access" },
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
    keyMetric: { label: "Mentorship Format", value: "1-on-1 Sessions & PR Reviews" },
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
    keyMetric: { label: "Graduation Deliverable", value: "Verifiable Digital Credential" },
  },
];

const ETHIOPIAN_DEMOGRAPHIC_FACTS = [
  {
    metric: "70%+",
    label: "Youth Population",
    description:
      "Over 90 million Ethiopians are under 30 years old, representing Africa's fastest-growing demographic dividend.",
    icon: Users,
  },
  {
    metric: "100k+",
    label: "Annual STEM Graduates",
    description:
      "50+ public universities graduate tens of thousands of engineers annually, yet face critical shortage of practical labs.",
    icon: GraduationCap,
  },
  {
    metric: "14+",
    label: "Regional Universities Linked",
    description:
      "Bridging the regional digital divide between Addis Ababa and universities in Hawassa, Jimma, Bahir Dar, Mekelle, and Dire Dawa.",
    icon: MapPinned,
  },
  {
    metric: "$0",
    label: "Tuition or Subscription Fees",
    description:
      "Fully subsidized non-profit model guaranteeing equal access to all students regardless of economic background.",
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
      tone: "default" as const,
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
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-1 text-xs font-medium text-zinc-700 mb-4 shadow-xs">
            <Zap size={12} className="text-zinc-700" />
            <span>The Ethiopian Software Engineering Movement</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl text-zinc-900">
            Democratizing elite tech education with the <span className="text-[#b91c1c]">PISTELS</span> framework
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-600 font-normal">
            {data?.hero.description ||
              "EthioTech is a non-profit educational platform bridging the chasm between academic theory and software engineering. Powered by the global Ethiopian diaspora, low-latency live sandboxes, and squad-based accountability, we empower Ethiopia's next generation of software architects."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="md" className="font-medium bg-[#b91c1c] hover:bg-[#991b1b] text-white shadow-xs">
                Join as Student <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button
                variant="outline"
                size="md"
                className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-xs"
              >
                <Users className="mr-2 h-4 w-4 text-zinc-700" /> Become a Mentor
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                const el = document.getElementById("pistels-framework");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-zinc-600 hover:text-zinc-900"
            >
              Explore the PISTELS Pillars
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-zinc-600">
            {(
              data?.hero.highlights ?? [
                "100% Free & Open Source",
                "WebRTC Sub-150ms Live Labs",
                "Diaspora Mentor Network",
                "Offline-First Mesh Sync",
                "Verifiable Proof-of-Work",
              ]
            ).map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-700" />
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
                className="relative overflow-hidden border-zinc-200 bg-white p-5 transition-all duration-150 hover:border-zinc-300 shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight text-zinc-900">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">{stat.label}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-600">{stat.helper}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── The Ethiopian Demographic Context & Challenge ─── */}
      <motion.section
        className="mx-auto max-w-7xl px-4 py-12 lg:py-14 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-0.5 text-xs font-medium text-zinc-700 mb-3 shadow-xs">
            <span>National Context & Strategic Imperative</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Unlocking Ethiopia’s <span className="text-[#b91c1c]">Demographic Dividend</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 font-normal">
            With over 125 million citizens and 70% under the age of 30, Ethiopia holds immense engineering potential.
            EthioTech provides the production-grade tooling and mentorship needed to bridge academic theory with
            industry demands.
          </p>
        </div>

        {/* Demographic Facts Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETHIOPIAN_DEMOGRAPHIC_FACTS.map((fact) => {
            const Icon = fact.icon;
            return (
              <Card
                key={fact.label}
                className="border-zinc-200 bg-white p-5 transition duration-150 hover:border-zinc-300 shadow-xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-2xl font-bold text-zinc-900">{fact.metric}</p>
                <h3 className="mt-0.5 text-sm font-semibold text-zinc-900">{fact.label}</h3>
                <p className="mt-1.5 text-xs leading-5 text-zinc-600">{fact.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Regional Divide vs Scaled Solution */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 text-amber-700">
                <Flame size={18} />
                <h3 className="text-base font-semibold text-zinc-900">The Theory vs. Practice Chasm</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-600">
                Most university students graduate having completed blackboard algorithms and single-page textbook
                projects. Real software engineering requires git branching workflows, automated CI/CD pipelines, Docker
                containers, and high-availability system architecture.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-zinc-600">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>Academic labs lack continuous deployment and cloud credits.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>Regional universities face sporadic connectivity and isolated cohorts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                  <span>Graduates lack verifiable proof-of-work repositories for hiring teams.</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-800">
                <ShieldCheck size={18} />
                <h3 className="text-base font-semibold text-zinc-900">How EthioTech Solves This</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-600">
                EthioTech provides a continuous software development lifecycle right in the browser and across our
                physical regional hubs. Students push real code, receive automated CI test feedback in seconds, and
                review code with senior mentors.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="default" size="sm">
                  100% Practical Labs
                </Badge>
                <Badge variant="default" size="sm">
                  Automated CI Pipelines
                </Badge>
                <Badge variant="default" size="sm">
                  Production Git Pull Requests
                </Badge>
                <Badge variant="default" size="sm">
                  Verifiable Skill Passports
                </Badge>
              </div>
            </div>
          </div>

          {/* Regional Solutions Cards */}
          <div className="space-y-3.5">
            <h3 className="text-base font-semibold text-zinc-900">Overcoming the Regional Digital Divide</h3>
            <p className="text-xs text-zinc-600">
              We design specifically for Ethiopian infrastructure, ensuring learners in every region enjoy an
              uncompromising learning experience.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGIONAL_DIVIDE_SOLUTIONS.map((sol) => {
                const Icon = sol.icon;
                return (
                  <Card
                    key={sol.title}
                    className="border-zinc-200 bg-white p-4 transition-all duration-150 hover:border-zinc-300 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                        <Icon size={15} />
                      </div>
                      <Badge variant="default" size="sm">
                        {sol.tag}
                      </Badge>
                    </div>
                    <h4 className="mt-2 text-xs font-semibold text-zinc-900">{sol.title}</h4>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{sol.subtitle}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">{sol.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── The PISTELS Framework (Core Pedagogical Backbone) ─── */}
      <section id="pistels-framework" className="relative border-y border-zinc-200 bg-zinc-50/50 py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-0.5 text-xs font-medium text-zinc-700 mb-3 shadow-xs">
              <span>Core Pedagogical Backbone</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              The <span className="text-[#b91c1c]">PISTELS</span> Ideology
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 font-normal">
              Our 7-pillar methodology engineered to systematically develop collaborative software engineers capable of
              shipping at high technical standards.
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
                  className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-xs font-semibold"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 shadow-xs"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs"
              >
                <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-12 lg:items-center">
                  {/* Left Column: Narrative & Mechanisms */}
                  <div className="space-y-4 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                        <activePillar.icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b91c1c]">
                            Pillar {activePillarIndex + 1} of 7
                          </span>
                          <Badge variant="default" size="sm">
                            {activePillar.badge}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 md:text-2xl">{activePillar.name}</h3>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-zinc-700">{activePillar.tagline}</p>
                    <p className="text-xs leading-relaxed text-zinc-600">{activePillar.philosophy}</p>

                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Core Architecture & Mechanics
                      </h4>
                      <ul className="mt-2 space-y-1.5">
                        {activePillar.mechanisms.map((mech) => (
                          <li key={mech} className="flex items-start gap-2 text-xs text-zinc-700">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
                            <span>{mech}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
                        <Trophy size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                          {activePillar.keyMetric.label}
                        </p>
                        <p className="text-base font-bold text-zinc-900">{activePillar.keyMetric.value}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Implementation Standards & Practices */}
                  <div className="space-y-3 lg:col-span-5">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
                      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
                        <span className="text-xs font-semibold text-zinc-900">Standard & Verification</span>
                        <Badge variant="default" size="sm">
                          PISTELS Framework
                        </Badge>
                      </div>

                      <div className="mt-3.5 space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Execution Paradigm
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-zinc-800">{activePillar.tagline}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Evaluation Focus
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-600 leading-relaxed">{activePillar.philosophy}</p>
                        </div>

                        <div className="rounded-md border border-zinc-200 bg-white p-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-700">Verification Outcome:</span>
                            <span className="font-semibold text-zinc-900">{activePillar.keyMetric.value}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Click any pillar below to inspect mechanics</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActivePillarIndex((prev) => (prev + 1) % PISTELS_PILLARS.length);
                        }}
                        className="text-zinc-700 hover:text-zinc-900 font-medium"
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
                  className={`cursor-pointer border p-3.5 transition-all duration-150 ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-50 shadow-xs"
                      : "border-zinc-200 bg-white hover:border-zinc-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-900">
                      {pillar.letter === "S2" ? "S" : pillar.letter}
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-semibold text-zinc-900">{pillar.name}</h4>
                  <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-2">{pillar.tagline}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Mission, Vision & Community Bridge ─── */}
      <motion.section
        className="mx-auto max-w-7xl px-4 py-12 lg:py-14 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-zinc-200 bg-white p-6 shadow-xs hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                <Target size={20} />
              </div>
              <Badge variant="default">Our Purpose</Badge>
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900">{data?.mission.title ?? "Our Mission"}</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              {data?.mission.description ??
                "To democratize software engineering education for every Ethiopian youth through free, open, and production-grade experiential learning, powered by low-latency tooling and global diaspora mentorship."}
            </p>
          </Card>

          <Card className="border-zinc-200 bg-white p-6 shadow-xs hover:border-zinc-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                <Compass size={20} />
              </div>
              <Badge variant="default">Our Horizon</Badge>
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900">{data?.vision.title ?? "Our Vision"}</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              {data?.vision.description ??
                "To establish Ethiopia as Africa's preeminent sovereign software and artificial intelligence talent powerhouse, placing 100,000+ certified engineers into high-growth pan-African companies and global distributed engineering teams by 2030."}
            </p>
          </Card>
        </div>

        {/* National Delivery Architecture Showcase */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Card className="border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#b91c1c]" />
                <span className="text-xs font-semibold text-zinc-900">National Delivery Architecture</span>
              </div>
              <Badge variant="default" size="sm">
                4-Tier Distributed System
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900">1. Regional Hub Network</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Physical Mesh</span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Dedicated computer labs with backup power, local caches, and fiber internet across 6 university
                  cities.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900">2. In-Browser WASM Runtime</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Edge Compute</span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Zero-install developer environment running locally via WebAssembly, resilient to network drops.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900">3. Diaspora Mentorship Mesh</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Global Network</span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Weekly code reviews and async architecture feedback from Ethiopian staff engineers worldwide.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900">4. Talent Verification Gateway</span>
                  <span className="text-[11px] text-zinc-500 font-medium">Verifiable Proof</span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  Cryptographically verifiable skill passports backed by production git commits and peer reviews.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500">
              <span>Sovereign Tech Talent Infrastructure</span>
              <span className="font-medium text-zinc-700">100% Free & Open Access</span>
            </div>
          </Card>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-0.5 text-xs font-medium text-zinc-700 mb-2 shadow-xs">
              <span>National Impact Model</span>
            </div>
            <h3 className="text-xl font-bold leading-tight sm:text-2xl text-zinc-900">
              {data?.bridge.title ?? "Bridging the Gap from Campus to Cloud"}
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-zinc-600">
              {data?.bridge.description ??
                "EthioTech operates as an open-impact digital public good. We bridge the structural divide by linking university classrooms directly to diaspora tech leads and production codebases."}
            </p>

            <div className="mt-4 space-y-2">
              {(
                data?.bridge.bullets ?? [
                  "Zero-cost access: No tuition, no upfront fees, and no income-share agreements.",
                  "Live pair programming with diaspora leads at top global tech companies.",
                  "Physical Regional Hubs with reliable power and internet across 6 university cities.",
                ]
              ).map((bullet, index) => {
                const icons = [Zap, ShieldCheck, MapPinned];
                const Icon = icons[index] ?? Zap;
                return (
                  <div
                    key={bullet}
                    className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                      <Icon size={14} />
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-700">{bullet}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/how-it-works">
                <Button variant="outline" size="sm">
                  See the 5-Stage Journey <ArrowRight size={13} className="ml-1.5" />
                </Button>
              </Link>
              <Link to="/hubs">
                <Button variant="ghost" size="sm" className="text-zinc-700 hover:text-zinc-900">
                  Explore Regional Hubs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Interactive Roadmap & Milestones ─── */}
      <motion.section
        className="mx-auto max-w-6xl px-4 py-12 lg:py-14 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-0.5 text-xs font-medium text-zinc-700 mb-3 shadow-xs">
            <span>Trajectory & Execution</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Platform Roadmap & Milestones</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-normal">
            Our multi-year blueprint scaling Ethiopia's digital software engineering infrastructure.
          </p>

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {(["all", "completed", "in-progress", "planned"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setRoadmapFilter(filterKey)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  roadmapFilter === filterKey
                    ? "border border-zinc-900 bg-zinc-900 text-white font-semibold shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 shadow-xs"
                }`}
              >
                {filterKey === "all" ? "All Phases" : filterKey.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {filteredRoadmap.map((item) => {
            const statusConfig = {
              completed: { badge: "Completed", variant: "default" as const, dotColor: "bg-zinc-800" },
              "in-progress": {
                badge: "Current Phase",
                variant: "default" as const,
                dotColor: "bg-[#b91c1c]",
              },
              planned: { badge: "Planned", variant: "default" as const, dotColor: "bg-zinc-400" },
            }[item.status];

            return (
              <Card
                key={item.phase}
                className="overflow-hidden border-zinc-200 bg-white p-5 shadow-xs transition-all duration-150 hover:border-zinc-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900">{item.phase}</span>
                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.badge}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{item.year}</span>
                </div>

                <h3 className="mt-2 text-base font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{item.description}</p>

                <div className="mt-3.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Key Deliverables & Milestones
                  </h4>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {item.deliverables.map((deliv) => (
                      <div key={deliv} className="flex items-start gap-2 text-xs text-zinc-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
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
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-0.5 text-xs font-medium text-zinc-700 mb-3 shadow-xs">
              <span>Institutional Trust</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Governance & Open Impact Model
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 font-normal">
              EthioTech is operated as a transparent, non-profit digital public good dedicated to long-term national
              capacity building.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border-zinc-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                <BookOpen size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">100% Open Source Syllabus</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
                All curriculum outlines, project boilerplate repositories, and testing suites are published under open
                permissive licenses (MIT / CC-BY-4.0). Any university or student can inspect or fork improvements.
              </p>
            </Card>

            <Card className="border-zinc-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                <ShieldCheck size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">Ethical Philanthropic Model</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
                We operate free from extractive investor incentives. Funding is derived exclusively from diaspora tech
                philanthropy, educational grants, and CSR partnerships. No student is ever charged tuition.
              </p>
            </Card>

            <Card className="border-zinc-200 bg-white p-5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                <ShieldCheck size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">Transparent Impact Auditing</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
                We maintain a telemetry reporting system documenting active cohorts, PR merge volumes, mentor volunteer
                hours, and verified career placements. Every metric is audited and verifiable.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-14 pt-6 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-0.5 text-xs font-medium text-zinc-700 mb-2.5 shadow-xs">
                <span>Join the Movement</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                Ready to transform your engineering trajectory?
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-600 sm:text-sm">
                Whether you are a university student eager to build production systems or a seasoned diaspora engineer
                ready to guide the next generation, EthioTech is your platform.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button
                  size="md"
                  className="w-full sm:w-auto font-medium bg-[#b91c1c] hover:bg-[#991b1b] text-white shadow-xs"
                >
                  Join as Student
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-xs"
                >
                  Become a Mentor
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="ghost" size="md" className="w-full sm:w-auto text-zinc-700 hover:text-zinc-900">
                  Explore Learning Flow <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
