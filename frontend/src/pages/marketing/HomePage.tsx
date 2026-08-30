import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Code2,
  Cpu,
  ShieldCheck,
  Sparkles,
  Video,
  Terminal,
  Users,
  Award,
  Zap,
  CheckCircle2,
  MapPin,
  Building2,
  Globe,
  Play,
  Check,
  Star,
  Compass,
  BookOpen,
  Radio,
  FileCode,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMarketingHome } from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

// ─── PISTELS 7 Core Pillars Data ───
interface PistelPillar {
  letter: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  icon: typeof Code2;
}

const PISTELS_PILLARS: PistelPillar[] = [
  {
    letter: "P",
    name: "Practical & Project-Based",
    tagline: "Code real production systems from Day 1",
    description:
      "No toy tutorials or multiple-choice quizzes. Build production-grade microservices, mobile apps, and distributed backends integrated with local payment APIs.",
    highlights: [
      "Industry-standard Git and GitHub workflows",
      "Automated CI/CD deployment pipelines",
      "Production capstone deliverables for your public portfolio",
    ],
    icon: Code2,
  },
  {
    letter: "I",
    name: "Interactive Live Learning",
    tagline: "Real-time classrooms and collaborative coding",
    description:
      "Engage daily in low-latency interactive sessions with live screen pairing, synchronized code editors, Q&A, and live mentor debugging.",
    highlights: [
      "Sub-150ms latency audio and video streaming",
      "Live whiteboard and synchronized code annotations",
      "Bandwidth-adaptive streaming optimized for 2G/3G/4G",
    ],
    icon: Video,
  },
  {
    letter: "S",
    name: "Squads & Social Learning",
    tagline: "4-peer agile cohorts for consistent completion",
    description:
      "Never learn in isolation. Every learner joins a dedicated 4-person sprint squad with weekly standups, peer pull request reviews, and collective accountability.",
    highlights: [
      "Weekly agile standups and sprint planning",
      "Peer code reviews and pair programming",
      "Squad accountability and leaderboard milestones",
    ],
    icon: Users,
  },
  {
    letter: "T",
    name: "Tech Tracks for Industry",
    tagline: "High-demand stacks aligned with modern employers",
    description:
      "Curricula co-designed with top tech employers in FinTech, AI, Cloud Infrastructure, and Telecom to ensure immediate job readiness upon graduation.",
    highlights: [
      "Next.js, Flutter, AWS, Kubernetes, and PyTorch",
      "Security best practices and OWASP compliance",
      "Microservices and resilient distributed systems",
    ],
    icon: Cpu,
  },
  {
    letter: "E",
    name: "Equity & Nationwide Access",
    tagline: "6 Regional Hubs breaking geographic barriers",
    description:
      "Physical innovation hubs across Addis Ababa, Bahir Dar, Hawassa, Mekelle, Dire Dawa, and Jimma provide high-speed fiber internet, workstations, and local community.",
    highlights: [
      "Free workstation and fiber internet access",
      "100% tuition-free scholarship model",
      "Offline-first sync architecture for low-connectivity regions",
    ],
    icon: Globe,
  },
  {
    letter: "L",
    name: "Live Senior Mentorship",
    tagline: "Direct access to diaspora and local tech leaders",
    description:
      "Get guided by senior software engineers, architects, and tech leads from Google, Microsoft, Amazon, Safaricom, and Chapa with weekly 1-on-1s and code reviews.",
    highlights: [
      "1-on-1 code reviews and architecture guidance",
      "Diaspora and local engineering leadership network",
      "Career roadmapping and technical mock interviews",
    ],
    icon: Award,
  },
  {
    letter: "S",
    name: "Sustainable Career Outcomes",
    tagline: "Verifiable credentials and direct employer pipelines",
    description:
      "Graduate with cryptographically signed credentials, public portfolio showcases, audited GitHub repositories, and direct interview pipelines with 50+ hiring partners.",
    highlights: [
      "Cryptographically signed verifiable certificates",
      "Audited GitHub project repositories with real commits",
      "Direct interview pipelines to enterprise hiring partners",
    ],
    icon: Award,
  },
];

// ─── Enhanced Structured Tracks Data ───
interface RichTrackData {
  id: string;
  category: "all" | "web" | "mobile" | "cloud" | "ai" | "security";
  categoryLabel: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  moduleCount: number;
  liveSessions: number;
  xpReward: number;
  description: string;
  skills: string[];
  capstones: string[];
  icon: typeof Code2;
}

const RICH_CURRICULUM_TRACKS: RichTrackData[] = [
  {
    id: "track-fullstack",
    category: "web",
    categoryLabel: "Fullstack Web",
    title: "Fullstack Web & Distributed Systems",
    level: "Beginner",
    moduleCount: 12,
    liveSessions: 48,
    xpReward: 4500,
    description:
      "Master modern TypeScript, React 19, Next.js 15, Node.js microservices, PostgreSQL, Redis, and containerized Docker deployments.",
    skills: ["React 19", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Redis", "Tailwind CSS"],
    capstones: ["Telebirr Integrated FinTech Gateway", "National Telemedicine Platform", "Realtime Squad Collaboration Board"],
    icon: Code2,
  },
  {
    id: "track-mobile",
    category: "mobile",
    categoryLabel: "Mobile Apps",
    title: "Cross-Platform Mobile Engineering",
    level: "Beginner",
    moduleCount: 10,
    liveSessions: 40,
    xpReward: 4000,
    description:
      "Build high-performance, offline-first mobile apps for Android & iOS using Flutter, Dart, React Native, SQLite, and local push services.",
    skills: ["Flutter", "Dart", "React Native", "SQLite", "Offline-First", "WebSockets", "Location APIs"],
    capstones: ["Ride-Hailing & Logistics SuperApp", "Agro-Commodity Exchange Marketplace", "Offline Digital School Portal"],
    icon: Smartphone,
  },
  {
    id: "track-cloud",
    category: "cloud",
    categoryLabel: "Cloud & DevOps",
    title: "Cloud Architecture & DevOps GitOps",
    level: "Intermediate",
    moduleCount: 10,
    liveSessions: 38,
    xpReward: 4200,
    description:
      "Design resilient multi-cloud architectures, Kubernetes clusters, Terraform infrastructure-as-code, and automated GitHub Actions CI/CD pipelines.",
    skills: ["Kubernetes", "Docker", "AWS / GCP", "Terraform", "Linux SysAdmin", "GitHub Actions", "Prometheus"],
    capstones: ["Multi-Region HA Kubernetes Cluster", "Zero-Downtime GitOps Deployment Engine", "Enterprise Observability Stack"],
    icon: Zap,
  },
  {
    id: "track-ai",
    category: "ai",
    categoryLabel: "Data & AI",
    title: "Applied AI, Data Science & Amharic NLP",
    level: "Intermediate",
    moduleCount: 12,
    liveSessions: 44,
    xpReward: 4800,
    description:
      "Harness Python, PyTorch, Scikit-Learn, computer vision, and LLM fine-tuning to build localized AI models for Ethiopian languages and industries.",
    skills: ["Python", "PyTorch", "Pandas", "Scikit-Learn", "Amharic NLP", "LLM Fine-Tuning", "OpenCV"],
    capstones: ["Amharic Speech-to-Text Transcriber", "Coffee Plant Disease Detection Vision AI", "FinTech Fraud Detection Classifier"],
    icon: Bot,
  },
  {
    id: "track-security",
    category: "security",
    categoryLabel: "Cyber Security",
    title: "Cyber Security & Defensive Operations",
    level: "Advanced",
    moduleCount: 10,
    liveSessions: 36,
    xpReward: 4000,
    description:
      "Learn penetration testing, SOC incident response, network cryptography, zero-trust architectures, and OWASP top 10 vulnerability remediation.",
    skills: ["Penetration Testing", "SOC Operations", "Network Defense", "Cryptography", "OWASP Top 10", "Wireshark"],
    capstones: ["Enterprise Security Audit & Penetration Report", "Zero-Trust Identity & Access Proxy", "Realtime SIEM Threat Monitor"],
    icon: ShieldCheck,
  },
];

// ─── Prominent Mentor Network Data ───
interface RichMentor {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  score: number;
  sessions: number;
  avatarSeed: string;
  expertise: string[];
  quote: string;
}

const FEATURED_MENTORS: RichMentor[] = [
  {
    id: "mentor-1",
    name: "Selamawit Tekle",
    role: "Staff Distributed Systems Engineer",
    company: "Google (ex-AAU)",
    location: "Silicon Valley, CA",
    score: 99,
    sessions: 142,
    avatarSeed: "Selamawit",
    expertise: ["Distributed Systems", "Go", "Cloud Architecture", "System Design"],
    quote: "Ethiopian youth have unbelievable talent. With structured mentorship, they build systems that compete globally.",
  },
  {
    id: "mentor-2",
    name: "Dawit Abraham",
    role: "Principal Mobile Architect",
    company: "FinTech Lead (London)",
    location: "London / Addis",
    score: 98,
    sessions: 118,
    avatarSeed: "Dawit",
    expertise: ["Flutter", "React Native", "Telebirr API", "Architecture"],
    quote: "Seeing students ship production mobile apps in 8 weeks is the most rewarding engineering experience.",
  },
  {
    id: "mentor-3",
    name: "Dr. Blen Hailu",
    role: "Senior AI Research Scientist",
    company: "European AI Lab",
    location: "Berlin, Germany",
    score: 100,
    sessions: 96,
    avatarSeed: "Blen",
    expertise: ["Amharic NLP", "PyTorch", "Deep Learning", "LLMs"],
    quote: "Building native AI models for Ethiopian languages requires deep local context combined with modern transformer architectures.",
  },
  {
    id: "mentor-4",
    name: "Yared Mengistu",
    role: "Principal DevOps & Security Architect",
    company: "AWS Certified Fellow",
    location: "Addis Ababa",
    score: 99,
    sessions: 130,
    avatarSeed: "Yared",
    expertise: ["Kubernetes", "Terraform", "SOC2", "CI/CD GitOps"],
    quote: "From zero to managing multi-node Kubernetes clusters, our learners master real-world production muscle memory.",
  },
  {
    id: "mentor-5",
    name: "Tsedey Bekele",
    role: "Senior Fullstack Engineer",
    company: "Chapa Payment Systems",
    location: "Addis Ababa",
    score: 98,
    sessions: 84,
    avatarSeed: "Tsedey",
    expertise: ["React 19", "Next.js", "Payment Gateways", "TypeScript"],
    quote: "Local FinTech is exploding. We train developers who understand security, scale, and high-concurrency transactions.",
  },
  {
    id: "mentor-6",
    name: "Kidus Girma",
    role: "Staff Infrastructure Engineer",
    company: "ex-Microsoft",
    location: "Seattle / Remote",
    score: 99,
    sessions: 105,
    avatarSeed: "Kidus",
    expertise: ["Linux Kernels", "Rust", "Distributed Databases", "Performance"],
    quote: "Mentorship bridges the gap between theoretical computer science and what top tech companies actually hire for.",
  },
];

// ─── Interactive Feature Showcase Tabs ───
type ShowcaseTabId = "classroom" | "sandbox" | "squads" | "certs";

interface ShowcaseTab {
  id: ShowcaseTabId;
  label: string;
  icon: typeof Video;
  tagline: string;
  badge: string;
  description: string;
  benefits: string[];
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: "classroom",
    label: "Live WebRTC Classroom",
    icon: Video,
    tagline: "Sub-150ms HD Live Classrooms with Multi-User Code Projection",
    badge: "Low-Bandwidth Optimized",
    description:
      "Experience interactive video learning engineered specifically for Ethiopian network conditions. Includes live synchronized code takeovers, multi-user digital whiteboards, dual-language audio streams, and automated recording with timestamped code markers.",
    benefits: [
      "Adaptive bitrate down to 256 kbps (Smooth over 2G/3G/4G)",
      "Instant mentor screen takeovers and line-by-line debugging",
      "Interactive code annotations & multi-user canvas whiteboard",
      "Amharic & English audio channels with real-time AI transcription",
    ],
  },
  {
    id: "sandbox",
    label: "Cloud Coding Sandbox",
    icon: Terminal,
    tagline: "Zero-Install In-Browser Cloud Linux Dev Environment",
    badge: "Instant 2-Second Spinup",
    description:
      "Say goodbye to complex local environment setup errors. Students code in an in-browser Monaco IDE backed by isolated Linux Docker containers with Node.js, Python, Go, PostgreSQL, and Rust ready in 2 seconds.",
    benefits: [
      "Instant automated test runner with live code coverage feedback",
      "Pre-configured starters for Next.js, FastAPI, Flutter & PyTorch",
      "Full interactive bash terminal with containerized isolation",
      "Live hot-reloading port forwarding for instant web & app preview",
    ],
  },
  {
    id: "squads",
    label: "Squads Collaboration",
    icon: Users,
    tagline: "Agile 4-Person Peer Cohorts with GitHub Review Workflows",
    badge: "89% Completion Rate",
    description:
      "Engineers don't work alone, and neither should students. Learners are placed in 4-person accountability squads that conduct weekly sprint planning, code reviews on GitHub PRs, and earn collective XP streak bonuses.",
    benefits: [
      "Integrated agile Kanban board & weekly sprint retrospectives",
      "GitHub pull request peer reviews and automated code grading",
      "Squad voice channels for instant pair-programming huddles",
      "Squad XP multipliers & weekly national leaderboard ranking",
    ],
  },
  {
    id: "certs",
    label: "Verified Certifications",
    icon: Award,
    tagline: "Tamper-Proof Cryptographic Credentials Linked to Real Code",
    badge: "Employer Auditable",
    description:
      "Unlike static PDF certificates, EthioTech credentials are cryptographically signed and link directly to audited GitHub project repositories. International and local employers can verify actual code quality in one click.",
    benefits: [
      "Tamper-proof on-chain / cryptographic verification signatures",
      "Direct deep links to audited production GitHub repositories",
      "One-click LinkedIn credential and resume portfolio sharing",
      "Direct priority hiring access with 50+ enterprise partner networks",
    ],
  },
];

// ─── 6 Regional Physical Hubs Data ───
const REGIONAL_HUBS = [
  { city: "Addis Ababa", hub: "Bole & 4 Kilo Innovation Hubs", seats: 120, status: "Active", bandwidth: "1 Gbps Fiber" },
  { city: "Bahir Dar", hub: "Lake Tana Tech Corridor", seats: 60, status: "Active", bandwidth: "500 Mbps Fiber" },
  { city: "Hawassa", hub: "Southern Industrial Tech Hub", seats: 60, status: "Active", bandwidth: "500 Mbps Fiber" },
  { city: "Mekelle", hub: "Northern Innovation Center", seats: 50, status: "Active", bandwidth: "500 Mbps Fiber" },
  { city: "Dire Dawa", hub: "Eastern Tech Junction", seats: 45, status: "Active", bandwidth: "300 Mbps Fiber" },
  { city: "Jimma", hub: "Oromia Regional Tech Lab", seats: 45, status: "Active", bandwidth: "300 Mbps Fiber" },
];

// ─── Enterprise & University Ecosystem Partners ───
const PARTNERS = [
  { name: "Addis Ababa University", category: "University Partner" },
  { name: "ASTU (Adama)", category: "Engineering Partner" },
  { name: "Jimma University", category: "Academic Partner" },
  { name: "Commercial Bank of Ethiopia", category: "FinTech Sponsor" },
  { name: "Chapa Payment Systems", category: "Industry Partner" },
  { name: "Safaricom Ethiopia", category: "Telecom Partner" },
  { name: "Ethio Telecom", category: "Connectivity Partner" },
  { name: "IceAddis Innovation Hub", category: "Ecosystem Partner" },
];

export function HomePage() {
  const reduceMotion = useReducedMotion();
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<ShowcaseTabId>("classroom");
  const [selectedTrackCategory, setSelectedTrackCategory] = useState<"all" | "web" | "mobile" | "cloud" | "ai" | "security">("all");
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["marketing", "home"],
    queryFn: fetchMarketingHome,
  });

  const filteredTracks = useMemo(() => {
    if (selectedTrackCategory === "all") return RICH_CURRICULUM_TRACKS;
    return RICH_CURRICULUM_TRACKS.filter((t) => t.category === selectedTrackCategory);
  }, [selectedTrackCategory]);

  const activeTabDetails = useMemo(() => {
    return SHOWCASE_TABS.find((t) => t.id === activeShowcaseTab) || SHOWCASE_TABS[0];
  }, [activeShowcaseTab]);

  const activePillar = PISTELS_PILLARS[activePillarIndex] || PISTELS_PILLARS[0];

  // Dynamic Metrics with fallback values
  const activeLearnersCount = data?.stats?.activeLearners ?? 12500;
  const approvalRate = data?.stats?.approvalRate ?? 94.2;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-44 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load the platform home page right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* ── Background Subtle Glow Element ── */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        className="page-shell pt-10 pb-16 lg:pt-16 lg:pb-24"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="space-y-8">
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Pan-Ethiopian Tech Learning & Mentorship Ecosystem
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl text-white">
              Building Ethiopia&apos;s Tech Future with{" "}
              <span className="glow-text text-primary">Hands-On Live Mentorship</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl max-w-2xl">
              Empowering youth from Grade 8 to university graduates with live senior engineering mentors, in-browser
              cloud sandboxes, collaborative 4-peer squads, and direct hiring pathways to top tech firms worldwide.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="group relative bg-primary text-black font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200"
                onClick={() => {
                  const el = document.getElementById("curriculum-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Explore Curriculum</span>
                <ArrowRight size={18} className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80 text-white"
                onClick={() => {
                  const el = document.getElementById("feature-showcase");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Play size={16} className="mr-2 text-primary" />
                <span>Try Live Demo</span>
              </Button>

              <Link to="/mentor-recruitment">
                <Button variant="ghost" size="lg" className="text-[var(--text-secondary)] hover:text-white">
                  <Users size={16} className="mr-2 text-primary" />
                  <span>Apply as Mentor</span>
                </Button>
              </Link>
            </div>

            {/* Trust Points Badges */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] font-semibold mb-3">
                Proven Platform Architecture
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Video, label: "WebRTC HD Classrooms" },
                  { icon: Terminal, label: "In-Browser Cloud Sandbox" },
                  { icon: Users, label: "4-Peer Sprint Squads" },
                  { icon: ShieldCheck, label: "Verifiable Digital Credentials" },
                  { icon: MapPin, label: "6 Regional Hubs" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-slate-700 hover:text-white"
                    >
                      <Icon size={13} className="text-primary" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: High-Tech Live Interactive Simulation Preview */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">ethio-tech-live-sandbox v2.4</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE COHORT • Squad 04</span>
                </div>
              </div>

              {/* Live WebRTC Streamer Card Inside IDE */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {/* Mentor Stream Box */}
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src=""
                      name="Selamawit Tekle"
                      userId="selamawit-tekle"
                      role="mentor"
                      size="md"
                      className="ring-1 ring-primary/40"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white">Selamawit Tekle</p>
                        <ShieldCheck size={13} className="text-primary" />
                      </div>
                      <p className="text-[10px] text-primary font-medium">Staff SRE @ Google (Mentor)</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Radio size={11} className="animate-pulse" /> 1080p • 38ms
                    </span>
                    <span>Addis Ababa Hub</span>
                  </div>
                </div>

                {/* Squad Members Active Box */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Active Peer Squad</span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      +20% Streak
                    </span>
                  </div>
                  <div className="flex items-center -space-x-2 mt-2">
                    {["Abebe K.", "Bethlehem T.", "Chala M.", "Dagmawi Z."].map((name) => (
                      <div
                        key={name}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-800 text-[10px] font-bold text-white"
                        title={name}
                      >
                        {name.charAt(0)}
                      </div>
                    ))}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-800 text-[10px] font-bold text-[var(--text-muted)]">
                      +24
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    <span>3 of 4 PRs merged into main</span>
                  </div>
                </div>
              </div>

              {/* Code Snippet Area */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-black/80 p-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <FileCode size={13} className="text-primary" />
                    <span className="text-white">telebirr_payment_gateway.go</span>
                  </div>
                  <span className="text-emerald-400 font-medium">● Synced</span>
                </div>
                <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <span className="text-cyan-400 font-semibold">func</span> ProcessTelebirrWebhook(w http.ResponseWriter, r *http.Request) &#123;
                  </p>
                  <p className="pl-4">
                    signature := r.Header.Get(<span className="text-amber-300">&quot;X-Telebirr-Signature&quot;</span>)
                  </p>
                  <p className="pl-4">
                    <span className="text-cyan-400 font-semibold">if err</span> := crypto.VerifyEd25519(signature, payload); err != nil &#123;
                  </p>
                  <p className="pl-8 text-rose-400">return http.Error(w, &quot;Unauthorized Payload&quot;, 401)</p>
                  <p className="pl-4">&#125;</p>
                  <p className="pl-4">
                    squad.BroadcastEvent(<span className="text-amber-300">&quot;payment:verified&quot;</span>, payload)
                  </p>
                  <p>&#125;</p>
                </div>
              </div>

              {/* Terminal Output Footer */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-[11px] font-mono text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>CI Suite: 18/18 Tests Passed (42ms)</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">Deployed to Addis Edge DC</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          2. NATIONAL REACH & IMPACT METRICS BAR
      ────────────────────────────────────────────────────────────── */}
      <section className="page-shell pb-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {formatCompactCount(activeLearnersCount)}+
              </p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Active Young Learners
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Grade 8 to University Grads</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                45,000+
              </p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Mentorship Hours
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">1-on-1 & Live Cohort Sessions</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                6 Hubs
              </p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Regional Innovation Hubs
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Addis, Bahir Dar, Hawassa & more</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                {approvalRate}%
              </p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Capstone Approval
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Audited Production Projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE PLATFORM FEATURE SHOWCASE / DEMO PREVIEW
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        id="feature-showcase"
        className="page-shell py-16 scroll-mt-24"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={13} />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything You Need to Master <span className="glow-text text-primary">Production Software</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Purpose-built for Ethiopian engineers. Zero friction, instant cloud sandboxes, adaptive live classrooms,
            and peer sprint squads that turn curious students into high-earning developers.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {SHOWCASE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeShowcaseTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveShowcaseTab(tab.id)}
                className={`relative flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/15 text-white shadow-md shadow-primary/10"
                    : "border-slate-800 bg-slate-900/60 text-[var(--text-secondary)] hover:border-slate-700 hover:text-white"
                }`}
              >
                <Icon size={16} className={isActive ? "text-primary" : "text-[var(--text-muted)]"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabDetails.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid gap-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
            >
              {/* Left Side: Deep Value Breakdown */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Zap size={12} />
                  <span>{activeTabDetails.badge}</span>
                </div>

                <h3 className="text-2xl font-bold text-white sm:text-3xl leading-tight">
                  {activeTabDetails.tagline}
                </h3>

                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {activeTabDetails.description}
                </p>

                <div className="space-y-2.5 pt-1">
                  {activeTabDetails.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check size={11} />
                      </div>
                      <span className="text-xs font-medium text-slate-200">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button size="sm">Experience It Now</Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button variant="outline" size="sm">
                      See Full Workflow
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side: Experiential UI Visual for this Tab */}
              <div className="relative rounded-xl border border-slate-800 bg-black/70 p-4 shadow-xl overflow-hidden">
                {activeTabDetails.id === "classroom" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Video size={15} className="text-primary" />
                        <span className="font-bold text-white">Live Classroom: Distributed Systems #12</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400">● 32ms Latency</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="aspect-video rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-white">Dawit A. (Screen Sharing)</span>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span>Whiteboard</span>
                          <span className="text-emerald-400">1080p</span>
                        </div>
                      </div>

                      <div className="aspect-video rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-white">Selamawit T. (Mentor)</span>
                        <div className="flex items-center gap-1 text-[10px] text-primary">
                          <Radio size={10} className="animate-pulse" /> Speaking
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-black/90 p-3">
                      <p className="text-[10px] text-[var(--text-muted)] mb-1">// Synchronized Code Annotation</p>
                      <p className="text-emerald-300 text-[11px]">
                        <span className="text-cyan-400">const</span> cluster = <span className="text-cyan-400">new</span> RaftCluster(&#123; nodes: 5, heartbeat: 150 &#125;);
                      </p>
                      <p className="text-amber-300 text-[10px] mt-1">
                        ↳ [Selamawit]: Leader election consensus reached in 18ms.
                      </p>
                    </div>
                  </div>
                )}

                {activeTabDetails.id === "sandbox" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Terminal size={15} className="text-primary" />
                        <span className="font-bold text-white">Linux Dev Container • Node 22 & PostgreSQL 16</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">● Running</span>
                    </div>

                    <div className="rounded-lg bg-black/90 p-3 text-[11px] space-y-1">
                      <p className="text-[var(--text-muted)]">$ npm test -- --coverage</p>
                      <p className="text-emerald-400">PASS tests/wallet_transfer.test.ts (0.42s)</p>
                      <p className="text-emerald-400">PASS tests/concurrency_lock.test.ts (0.38s)</p>
                      <p className="text-white font-bold mt-2">
                        Test Suites: 2 passed, 2 total | Statements: 98.4% (128/130)
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px]">
                      <span className="text-primary font-semibold">Web Preview on localhost:3000</span>
                      <span className="text-slate-300 text-xs">Ready</span>
                    </div>
                  </div>
                )}

                {activeTabDetails.id === "squads" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Users size={15} className="text-primary" />
                        <span className="font-bold text-white">Squad 07: Addis Vanguard (Sprint #4)</span>
                      </div>
                      <span className="text-[10px] text-primary font-bold">14-Day Streak</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                        <div>
                          <p className="font-bold text-white text-[11px]">PR #42: Add Telebirr USSD parser</p>
                          <p className="text-[10px] text-[var(--text-muted)]">by Bethlehem T. • 2 Approvals</p>
                        </div>
                        <Badge variant="success">Merged</Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                        <div>
                          <p className="font-bold text-white text-[11px]">PR #43: Implement JWT Auth Middleware</p>
                          <p className="text-[10px] text-[var(--text-muted)]">by Chala M. • Review in progress</p>
                        </div>
                        <Badge variant="warning">Reviewing</Badge>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-900/60 p-2.5 text-[11px] flex items-center justify-between border border-slate-800">
                      <span className="text-[var(--text-muted)]">Squad Total XP this Week:</span>
                      <span className="font-bold text-primary">12,450 XP (Rank #2)</span>
                    </div>
                  </div>
                )}

                {activeTabDetails.id === "certs" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Verified Credential</p>
                          <p className="text-sm font-bold text-white mt-1">Fullstack Distributed Systems Engineer</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Issued to: Abebe Kebede (Cohort 04)</p>
                        </div>
                        <div className="h-9 w-9 rounded-lg border border-slate-800 bg-black/60 flex items-center justify-center text-primary font-bold text-xs">
                          QR
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1 text-[10px]">
                        <p className="text-slate-300">
                          <span className="text-[var(--text-muted)]">Audited Repo:</span> github.com/ethio-tech-graduates/telebirr-gateway
                        </p>
                        <p className="text-emerald-400">
                          <span className="text-[var(--text-muted)]">Signature Hash:</span> 0x8f3c91a7e20b4d... [Verified]
                        </p>
                        <p className="text-slate-300">
                          <span className="text-[var(--text-muted)]">Senior Mentor Sign-off:</span> Selamawit Tekle (Staff SRE)
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-[var(--text-muted)]">
                      Instant 1-Click Verification for Hiring Partners & LinkedIn
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          4. PISTELS PEDAGOGICAL & IMPACT IDEOLOGY SECTION
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        id="pistels-section"
        className="page-shell py-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Compass size={13} />
            <span>The PISTELS Framework</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            7 Pillars Engineered for <span className="glow-text text-primary">Engineering Mastery</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            PISTELS is our proprietary pedagogical framework designed to bridge the gap between
            academic theory and the requirements of modern software engineering.
          </p>
        </div>

        {/* 7 Pillar Letter Ribbon */}
        <div className="mt-10 grid grid-cols-7 gap-2 md:gap-3">
          {PISTELS_PILLARS.map((pillar, idx) => {
            const isSelected = activePillarIndex === idx;
            return (
              <button
                key={`${pillar.letter}-${idx}`}
                type="button"
                onClick={() => setActivePillarIndex(idx)}
                className={`group flex flex-col items-center justify-center rounded-xl border p-3 sm:p-4 transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary shadow-md shadow-primary/10 -translate-y-1"
                    : "border-slate-800 bg-slate-900/60 text-[var(--text-secondary)] hover:border-slate-700 hover:text-white"
                }`}
              >
                <span
                  className={`text-2xl sm:text-3xl font-black transition-colors ${
                    isSelected ? "text-primary" : "text-slate-400 group-hover:text-white"
                  }`}
                >
                  {pillar.letter}
                </span>
                <span className="hidden sm:block mt-1 text-[10px] font-semibold text-[var(--text-muted)] text-center line-clamp-1">
                  {pillar.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Card Deep Dive */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar.name}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 shadow-xl"
            >
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary font-black text-xl border border-primary/30">
                      {activePillar.letter}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">{activePillar.name}</h3>
                      <p className="text-xs font-semibold text-primary">{activePillar.tagline}</p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {activePillar.description}
                  </p>

                  <div className="space-y-2 pt-1">
                    {activePillar.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2.5 text-xs text-slate-200">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    Methodology in Action
                  </p>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)] italic">
                    &ldquo;Traditional training programs often fall short due to lack of team accountability and real-world system complexity.
                    EthioTech combines live diaspora mentors, peer squads, and local hubs to guarantee true mastery.&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-slate-800">
                    <span>Applicable across all 5 tracks</span>
                    <Link to="/about" className="text-primary font-semibold hover:underline">
                      Learn about our vision →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          5. STRUCTURED TRACKS CURRICULUM SHOWCASE
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        id="curriculum-section"
        className="page-shell py-16 scroll-mt-24"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <BookOpen size={13} />
              <span>Job-Ready Curricula</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered for <span className="glow-text text-primary">High-Demand Tech Careers</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Structured step-by-step pathways taking learners from foundational coding to shipping production systems.
            </p>
          </div>

          <Link to="/tracks">
            <Button variant="outline" className="border-slate-800 bg-slate-900/60 hover:border-slate-700 text-white">
              <span>View All Tracks</span>
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>

        {/* Track Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Tracks" },
            { id: "web", label: "Fullstack Web" },
            { id: "mobile", label: "Mobile Apps" },
            { id: "cloud", label: "Cloud & DevOps" },
            { id: "ai", label: "Data & AI" },
            { id: "security", label: "Cyber Security" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedTrackCategory(cat.id as any)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                selectedTrackCategory === cat.id
                  ? "border-primary bg-primary text-black"
                  : "border-slate-800 bg-slate-900/60 text-[var(--text-secondary)] hover:border-slate-700 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tracks Grid */}
        <motion.div
          className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredTracks.map((track) => {
            const Icon = track.icon;
            return (
              <motion.div key={track.id} variants={itemVariants} className="h-full">
                <Card className="group flex h-full flex-col justify-between border-slate-800 bg-slate-900/70 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50">
                  <div>
                    {/* Header Top Bar */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-primary ring-1 ring-slate-700 group-hover:bg-primary/20 transition-colors">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="default" size="sm">{track.level}</Badge>
                        <Badge variant="success" size="sm">{track.moduleCount} Modules</Badge>
                      </div>
                    </div>

                    {/* Track Title & Description */}
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {track.categoryLabel}
                      </span>
                      <h3 className="text-lg font-bold leading-snug text-white group-hover:text-primary transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{track.description}</p>
                    </div>

                    {/* Skill Tags */}
                    <div className="mt-3.5 flex flex-wrap gap-1">
                      {track.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Capstone Projects Highlight */}
                    <div className="mt-4 rounded-xl border border-slate-800 bg-black/40 p-3 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                        <Award size={12} className="text-primary" />
                        <span>Shipped Capstone Projects</span>
                      </p>
                      <ul className="space-y-1 text-xs text-slate-200">
                        {track.capstones.map((cap) => (
                          <li key={cap} className="flex items-center gap-1.5 text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Bottom Meta & CTA */}
                  <div className="mt-5 border-t border-slate-800 pt-3.5 flex items-center justify-between">
                    <div className="text-xs text-[var(--text-muted)]">
                      <span className="font-semibold text-white">{track.liveSessions}</span> Live Sessions •{" "}
                      <span className="font-semibold text-primary">{track.xpReward} XP</span>
                    </div>

                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-white"
                    >
                      <span>Enroll</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          6. PROMINENT MENTOR NETWORK SPOTLIGHT
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        id="mentors-section"
        className="page-shell py-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Award size={13} />
              <span>World-Class Mentors</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Learn From <span className="glow-text text-primary">Global & Local Leaders</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Direct access to Ethiopian staff engineers, architects, and technical founders from Silicon Valley, Europe,
              and leading local African enterprises.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/mentors">
              <Button variant="outline" className="border-slate-800 bg-slate-900/60 hover:border-slate-700 text-white">
                View All Mentors
              </Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button>Become a Mentor</Button>
            </Link>
          </div>
        </div>

        <motion.div
          className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {FEATURED_MENTORS.map((mentor) => (
            <motion.div key={mentor.id} variants={itemVariants} className="h-full">
              <Card className="flex h-full flex-col justify-between border-slate-800 bg-slate-900/70 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
                <div>
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      src=""
                      name={mentor.name}
                      userId={mentor.id}
                      role="mentor"
                      size="lg"
                      className="ring-1 ring-primary/40"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base">{mentor.name}</h3>
                        <ShieldCheck size={14} className="text-primary shrink-0" />
                      </div>
                      <p className="text-xs font-semibold text-primary">{mentor.role}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {mentor.company} • {mentor.location}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3.5 text-xs italic leading-relaxed text-[var(--text-secondary)]">
                    &ldquo;{mentor.quote}&rdquo;
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {mentor.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-800 pt-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Star size={13} fill="currentColor" />
                    <span>{mentor.score}% Rating</span>
                  </div>
                  <span className="text-[var(--text-muted)]">{mentor.sessions} Sessions Delivered</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          7. DECENTRALIZED REGIONAL HUBS SHOWCASE
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        className="page-shell py-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-10 shadow-xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Globe size={13} />
                <span>Nationwide Physical Reach</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                6 Regional Hubs Powering <span className="glow-text text-primary">Equal Access</span>
              </h2>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Geographic location should never limit talent. EthioTech operates physical access centers across
                major Ethiopian cities, equipped with enterprise gigabit fiber, power backup, high-end workstations,
                and on-site community leads.
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {REGIONAL_HUBS.map((hub) => (
                  <div
                    key={hub.city}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-1.5 text-primary">
                      <MapPin size={13} />
                      <span className="font-bold text-white text-xs">{hub.city}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-1">{hub.hub}</p>
                    <p className="mt-1.5 text-[10px] font-semibold text-emerald-400">
                      {hub.seats} Seats • {hub.bandwidth}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <Link to="/hubs">
                  <Button variant="outline" size="sm" className="border-slate-800 text-white hover:border-primary">
                    <span>Explore All Regional Hubs</span>
                    <ArrowRight size={14} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Callout Box */}
            <div className="relative rounded-xl border border-slate-800 bg-black/60 p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                <span>Community & In-Person Hackathons</span>
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Hubs host weekly in-person sprint demos, weekend hackathons, algorithmic coding competitions, and local
                mentor office hours.
              </p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-1.5 text-xs">
                <p className="font-bold text-white">Upcoming Event:</p>
                <p className="text-primary font-semibold">National FinTech & AI Hackathon</p>
                <p className="text-[var(--text-muted)] text-[11px]">Hosted synchronously across all 6 hubs with 1M ETB in project grants.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          8. INSTITUTIONAL PARTNERS & STAKEHOLDER ECOSYSTEM
      ────────────────────────────────────────────────────────────── */}
      <section className="page-shell py-12">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] font-bold">
            Trusted By & Partnering with Leading Institutions
          </p>
          <div className="mt-6 flex flex-wrap justify-center items-center gap-3 md:gap-4">
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-center transition-all hover:border-primary/40"
              >
                <p className="text-xs font-bold text-white">{p.name}</p>
                <p className="text-[10px] text-primary">{p.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. HIGH-CONVERSION BOTTOM STICKY / HERO CTA BANNER
      ────────────────────────────────────────────────────────────── */}
      <section className="page-shell pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 md:p-12 shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-3">
              <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Next Cohort Starting Soon
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Ready to Build the Future of <span className="glow-text text-primary">Ethiopian Tech?</span>
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-xl">
                Join thousands of young developers mastering real-world software engineering with live senior mentorship,
                cloud sandboxes, and collaborative squads.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-black font-bold">
                  <span>Start Coding Free</span>
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 text-white hover:border-primary">
                  Join as Senior Mentor
                </Button>
              </Link>
              <Link to="/partners">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-[var(--text-secondary)] hover:text-white">
                  Partner with Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
