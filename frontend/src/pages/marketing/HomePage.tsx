import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Code2,
  ShieldCheck,
  Video,
  Terminal,
  Users,
  Award,
  Zap,
  CheckCircle2,
  MapPin,
  Building2,
  Globe,
  Check,
  Star,
  Compass,
  BookOpen,
  Radio,
  Smartphone,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { fetchMarketingHome } from "@/services/marketingService";
import { LOCAL_MEDIA_ASSETS } from "@/config/mediaConfig";

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
    title: "Fullstack Web Systems",
    level: "Beginner",
    moduleCount: 12,
    liveSessions: 48,
    xpReward: 4500,
    description: "Build scalable web apps with React 19, Next.js, Node.js microservices, PostgreSQL, and Docker.",
    skills: ["React 19", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Redis", "Tailwind CSS"],
    capstones: [
      "Telebirr Integrated FinTech Gateway",
      "National Telemedicine Platform",
      "Realtime Squad Collaboration Board",
    ],
    icon: Code2,
  },
  {
    id: "track-mobile",
    category: "mobile",
    categoryLabel: "Mobile Apps",
    title: "Mobile App Engineering",
    level: "Beginner",
    moduleCount: 10,
    liveSessions: 40,
    xpReward: 4000,
    description: "Build offline-first mobile apps for Android and iOS using Flutter, Dart, React Native, and SQLite.",
    skills: ["Flutter", "Dart", "React Native", "SQLite", "Offline-First", "WebSockets", "Location APIs"],
    capstones: [
      "Ride-Hailing & Logistics SuperApp",
      "Agro-Commodity Exchange Marketplace",
      "Offline Digital School Portal",
    ],
    icon: Smartphone,
  },
  {
    id: "track-cloud",
    category: "cloud",
    categoryLabel: "Cloud & DevOps",
    title: "Cloud & DevOps Engineering",
    level: "Intermediate",
    moduleCount: 10,
    liveSessions: 38,
    xpReward: 4200,
    description:
      "Design resilient cloud architecture, Kubernetes clusters, Terraform code, and automated CI/CD pipelines.",
    skills: ["Kubernetes", "Docker", "AWS / GCP", "Terraform", "Linux SysAdmin", "GitHub Actions", "Prometheus"],
    capstones: [
      "Multi-Region HA Kubernetes Cluster",
      "Zero-Downtime GitOps Deployment Engine",
      "Enterprise Observability Stack",
    ],
    icon: Zap,
  },
  {
    id: "track-ai",
    category: "ai",
    categoryLabel: "Data & AI",
    title: "Applied AI & Data Science",
    level: "Intermediate",
    moduleCount: 12,
    liveSessions: 44,
    xpReward: 4800,
    description:
      "Build machine learning models, NLP pipelines, data processing pipelines, and neural networks in PyTorch.",
    skills: ["Python", "PyTorch", "Pandas", "Scikit-Learn", "Amharic NLP", "LLM Fine-Tuning", "OpenCV"],
    capstones: [
      "Amharic Speech-to-Text Transcriber",
      "Coffee Plant Disease Detection Vision AI",
      "FinTech Fraud Detection Classifier",
    ],
    icon: Bot,
  },
  {
    id: "track-security",
    category: "security",
    categoryLabel: "Cyber Security",
    title: "Cyber Security & Systems",
    level: "Advanced",
    moduleCount: 10,
    liveSessions: 36,
    xpReward: 4000,
    description: "Network defense, penetration testing, application security, and cryptographic protocols.",
    skills: ["Penetration Testing", "SOC Operations", "Network Defense", "Cryptography", "OWASP Top 10", "Wireshark"],
    capstones: [
      "Enterprise Security Audit & Penetration Report",
      "Zero-Trust Identity & Access Proxy",
      "Realtime SIEM Threat Monitor",
    ],
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
    quote:
      "Ethiopian youth have unbelievable talent. With structured mentorship, they build systems that compete globally.",
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
    quote:
      "Building native AI models for Ethiopian languages requires deep local context combined with modern transformer architectures.",
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
    quote:
      "From zero to managing multi-node Kubernetes clusters, our learners master real-world production muscle memory.",
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
    quote:
      "Local FinTech is exploding. We train developers who understand security, scale, and high-concurrency transactions.",
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
    quote:
      "Mentorship bridges the gap between theoretical computer science and what top tech companies actually hire for.",
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
    label: "Live Classroom",
    icon: Video,
    tagline: "Low-Bandwidth Live Classrooms with Code Projection",
    badge: "Low-Bandwidth Ready",
    description:
      "Interactive video learning engineered for low bandwidth with mentor code takeovers, digital whiteboards, and timestamped recordings.",
    benefits: [
      "Adaptive streaming down to 256 kbps",
      "Live mentor screen takeover and line-by-line debugging",
      "Interactive whiteboard and code annotations",
      "Timestamped recordings for offline review",
    ],
  },
  {
    id: "sandbox",
    label: "In-Browser Workspace",
    icon: Terminal,
    tagline: "In-Browser Linux Workspaces with Instant Terminal",
    badge: "Instant Launch",
    description:
      "Write code in a browser-based Monaco editor backed by Linux containers with Node.js, Python, Go, and PostgreSQL ready in seconds.",
    benefits: [
      "Integrated test runner with instant feedback",
      "Pre-configured fullstack starter projects",
      "Interactive terminal with container isolation",
      "Live port forwarding for browser preview",
    ],
  },
  {
    id: "squads",
    label: "Peer Squads",
    icon: Users,
    tagline: "Four-Person Agile Squads with Weekly Code Reviews",
    badge: "Agile Workflow",
    description:
      "Work in dedicated 4-person squads with weekly standups, GitHub pull request reviews, and shared sprint milestones.",
    benefits: [
      "Weekly standups and sprint planning",
      "GitHub pull request peer reviews",
      "Voice channels for pair programming",
      "Squad XP bonuses and sprint tracking",
    ],
  },
  {
    id: "certs",
    label: "Certificates",
    icon: Award,
    tagline: "Verifiable Credentials Linked to Audited Repositories",
    badge: "Employer Audited",
    description:
      "Cryptographically signed certificates linking directly to audited GitHub project repositories for one-click employer verification.",
    benefits: [
      "Cryptographically signed verification signatures",
      "Direct links to audited GitHub repositories",
      "One-click portfolio and resume sharing",
      "Direct review pipelines to tech employers",
    ],
  },
];

// ─── 6 Regional Physical Hubs Data ───
const REGIONAL_HUBS = [
  {
    city: "Addis Ababa",
    hub: "Bole & 4 Kilo Innovation Hubs",
    seats: 120,
    status: "Active",
    bandwidth: "1 Gbps Fiber",
  },
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
  const [selectedTrackCategory, setSelectedTrackCategory] = useState<
    "all" | "web" | "mobile" | "cloud" | "ai" | "security"
  >("all");

  const { data } = useQuery({
    queryKey: ["marketing", "home"],
    queryFn: fetchMarketingHome,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const filteredTracks = useMemo(() => {
    if (selectedTrackCategory === "all") return RICH_CURRICULUM_TRACKS;
    return RICH_CURRICULUM_TRACKS.filter((t) => t.category === selectedTrackCategory);
  }, [selectedTrackCategory]);

  const activeTabDetails = useMemo(() => {
    return SHOWCASE_TABS.find((t) => t.id === activeShowcaseTab) || SHOWCASE_TABS[0];
  }, [activeShowcaseTab]);

  // Dynamic Metrics with fallback values — page renders immediately, updates when API resolves
  const activeLearnersCount = data?.stats?.activeLearners ?? 12500;
  const approvalRate = data?.stats?.approvalRate ?? 94.2;

  return (
    <div className="relative overflow-hidden selection:bg-slate-200 selection:text-slate-900">
      {/* Luminous Ambient Background Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(185,28,28,0.05),rgba(30,58,138,0.03),transparent_70%)] dark:opacity-20"
        aria-hidden="true"
      />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Decluttered, Balanced 36-44px Typography)
      ────────────────────────────────────────────────────────────── */}
      <motion.section
        className="page-shell relative pt-8 pb-12 lg:pt-12 lg:pb-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-[var(--shadow-xs)] backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />
              <span>Tuition-Free Engineering Fellowship</span>
            </div>

            {/* Main Headline - Balanced & Fixed Size (36-44px desktop / 28-32px mobile) */}
            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.65rem] text-slate-900 max-w-2xl break-words">
              Learn From Engineers Shipping in Production Right Now.
            </h1>

            {/* Subtitle - Persuasive Reason-to-Believe */}
            <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl font-normal">
              Not instructors reading slides. Senior engineers reviewing your code, line by line, the way they'd review
              a teammate's.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-1">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-medium">
                  <span>Start Learning Free</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto gap-2 font-medium"
                onClick={() => {
                  const el = document.getElementById("curriculum-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Compass size={16} />
                <span>Explore 6 Engineering Tracks</span>
              </Button>
            </div>

            {/* Single Row of Differentiated Trust Points */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <CheckCircle2 size={15} className="text-[var(--secondary)]" />
                <span>100% Tuition-Free</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <CheckCircle2 size={15} className="text-[var(--secondary)]" />
                <span>Solar-Backed Tech Hubs</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <CheckCircle2 size={15} className="text-[var(--secondary)]" />
                <span>Verified GitHub Portfolios</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Engineering Imagery */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[var(--shadow-card)] dark:border-white/10 dark:bg-slate-900/50">
              <SmartImage
                src={LOCAL_MEDIA_ASSETS.hero.collaboration}
                alt="Two African software engineers reviewing code logic and architecture over a monitor in a tech office"
                priority
                aspectRatio="aspect-[4/3]"
                hoverEffect="zoom"
                className="h-full w-full object-cover"
                wrapperClassName="h-full w-full border-none bg-transparent"
                width={1200}
                quality={88}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─────────────────────────────────────────────────────────────
          2. NATIONAL REACH & IMPACT METRICS BAR + ARCHITECTURE PILLARS
      ────────────────────────────────────────────────────────────── */}
      <section className="page-shell pb-12 lg:pb-14">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:grid-cols-4 lg:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {data ? (
                  <>{formatCompactCount(activeLearnersCount)}+</>
                ) : (
                  <span
                    className="inline-block h-7 w-14 rounded-md bg-slate-100 animate-pulse dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"
                    aria-hidden="true"
                  />
                )}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Active Learners</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Secondary to University</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold tracking-tight text-slate-900">45,000+</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Mentorship Hours</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Live Pair Sessions</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold tracking-tight text-slate-900">6 Hubs</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Regional Tech Hubs</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Six Physical Centers</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {data ? (
                  <>{approvalRate}%</>
                ) : (
                  <span
                    className="inline-block h-7 w-14 rounded-md bg-slate-100 animate-pulse dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"
                    aria-hidden="true"
                  />
                )}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Capstone Approval</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Audited Code Reviews</p>
            </div>
          </div>

          {/* Folded Architecture Highlight Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Core Learning Stack</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Video, label: "WebRTC Classrooms" },
                { icon: Terminal, label: "In-Browser Workspace" },
                { icon: Users, label: "Peer Squads" },
                { icon: ShieldCheck, label: "Audited Certificates" },
                { icon: MapPin, label: "Regional Hubs" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 px-2.5 py-1 text-xs text-slate-700 shadow-[var(--shadow-xs)] hover:border-slate-300 hover:bg-white transition-all"
                  >
                    <Icon size={13} className="text-[var(--secondary)]" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-slate-800 shadow-[var(--shadow-xs)]">
            <Layers size={13} className="text-[var(--secondary)]" />
            <span>Platform Features</span>
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
            Everything Needed to Ship <span className="text-primary">Production Code</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal max-w-xl mx-auto">
            A complete technical learning environment: live mentor reviews, in-browser Linux workspaces, peer squads,
            and verifiable project portfolios.
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
                className={`relative flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs font-semibold"
                    : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-[var(--shadow-xs)]"
                }`}
              >
                <Icon size={15} className={isActive ? "text-white" : "text-slate-500"} />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid gap-8 rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center shadow-[var(--shadow-card)]"
            >
              {/* Left Side: Deep Value Breakdown */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-0.5 text-xs font-semibold text-[var(--secondary)] dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                  <Zap size={12} className="text-[var(--secondary)]" />
                  <span>{activeTabDetails.badge}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 sm:text-2xl leading-tight">
                  {activeTabDetails.tagline}
                </h3>

                <p className="text-sm leading-relaxed text-slate-600">{activeTabDetails.description}</p>

                <div className="space-y-2 pt-1">
                  {activeTabDetails.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200/60 text-[var(--secondary)] dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                        <Check size={11} />
                      </div>
                      <span className="text-xs font-medium text-slate-800">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-2.5">
                  <Link to="/register">
                    <Button size="sm">Start Learning</Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button variant="secondary" size="sm">
                      View Workflow
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side: Experiential UI Visual for this Tab */}
              <div className="relative rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-4 shadow-[var(--shadow-xs)] overflow-hidden">
                {activeTabDetails.id === "classroom" && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Video size={14} className="text-[var(--secondary)]" />
                        <span className="font-semibold text-slate-900">Live Classroom: Distributed Systems #12</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700">● 32ms Latency</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="aspect-video rounded-lg border border-slate-200/80 bg-white p-2.5 flex flex-col justify-between shadow-[var(--shadow-xs)]">
                        <span className="text-[10px] font-semibold text-slate-900">Dawit A. (Screen Sharing)</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Whiteboard</span>
                          <span className="text-slate-600 font-medium">1080p</span>
                        </div>
                      </div>

                      <div className="aspect-video rounded-lg border border-slate-200/80 bg-white p-2.5 flex flex-col justify-between shadow-[var(--shadow-xs)]">
                        <span className="text-[10px] font-semibold text-slate-900">Selamawit T. (Mentor)</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-700 font-medium">
                          <Radio size={10} className="animate-pulse text-[var(--secondary)]" /> Speaking
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-[var(--shadow-xs)]">
                      <p className="text-[10px] text-slate-500 mb-1">// Synchronized Code Annotation</p>
                      <p className="text-slate-800 text-[11px]">
                        <span className="text-[var(--secondary)] font-semibold">const</span> cluster ={" "}
                        <span className="text-[var(--secondary)] font-semibold">new</span> RaftCluster(&#123; nodes: 5,
                        heartbeat: 150 &#125;);
                      </p>
                      <p className="text-slate-600 text-[10px] mt-1">
                        ↳ [Selamawit]: Leader election consensus reached in 18ms.
                      </p>
                    </div>
                  </div>
                )}

                {activeTabDetails.id === "sandbox" && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-[var(--secondary)]" />
                        <span className="font-semibold text-slate-900">
                          Cloud Devcontainer · Node.js 22 & PostgreSQL 16
                        </span>
                      </div>
                      <Badge variant="secondary" size="sm" className="gap-1 text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--secondary)] animate-pulse" /> Running
                      </Badge>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-2 shadow-[var(--shadow-xs)]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-900">Module Checkpoint 04</span>
                        <span className="text-slate-500 font-medium">Step 3 of 4</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Implement atomic database transactions and connection pooling with pg-pool.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-700">
                          <CheckCircle2 size={13} className="text-[var(--secondary)]" />
                          <span>Database migrations applied cleanly</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-700">
                          <CheckCircle2 size={13} className="text-[var(--secondary)]" />
                          <span>Integration test suite passed (12/12)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] shadow-[var(--shadow-xs)]">
                      <span className="text-slate-700 font-medium">In-Browser Live Preview</span>
                      <span className="text-slate-500 font-mono text-[10px]">localhost:3000 · Port Forwarded</span>
                    </div>
                  </div>
                )}

                {activeTabDetails.id === "squads" && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-[var(--secondary)]" />
                        <span className="font-semibold text-slate-900">4-Peer Agile Sprint Squad</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Sprint Cycle #4</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-[var(--shadow-xs)]">
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">PR #14: Implement USSD Parser Gateway</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">2 Peer Code Reviews Approved</p>
                        </div>
                        <Badge variant="secondary" size="sm">
                          Approved
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-[var(--shadow-xs)]">
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">PR #15: JWT Authentication Middleware</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Code review requested</p>
                        </div>
                        <Badge variant="outline" size="sm">
                          Under Review
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 text-[11px] text-slate-600 border border-slate-200/80 shadow-[var(--shadow-xs)]">
                      Learn collaboratively with peers on scheduled sprints, unblocking each other and shipping
                      together.
                    </div>
                  </div>
                )}

                {activeTabDetails.id === "certs" && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-xs)] space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            Verifiable Digital Credential
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            Fullstack Cloud & Distributed Systems
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Earned by completing 16 lessons & capstone defense
                          </p>
                        </div>
                        <div className="h-8 w-8 rounded-lg border border-blue-200/70 bg-blue-50/70 flex items-center justify-center text-[var(--secondary)] font-bold text-xs dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                          <Award size={16} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                        <p className="text-slate-700">
                          <span className="text-slate-500">Verified Capstone:</span> Production API Gateway with
                          Distributed Storage
                        </p>
                        <p className="text-slate-700">
                          <span className="text-slate-500">Attestation:</span> Reviewed & signed off by Senior
                          Engineering Fellow
                        </p>
                      </div>
                    </div>

                    <div className="text-center text-[11px] text-slate-500 font-medium">
                      Publicly shareable credential verifiable by hiring partners and engineering leads
                    </div>
                  </div>
                )}
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
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-slate-800 shadow-[var(--shadow-xs)]">
              <BookOpen size={13} className="text-[var(--secondary)]" />
              <span>Structured Tracks</span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
              Curriculums Built for <span className="text-primary">Production Engineering</span>
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
              Step-by-step pathways taking learners from foundational coding to shipping production systems.
            </p>
          </div>

          <Link to="/tracks">
            <Button variant="secondary" size="sm">
              <span>View Tracks</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Track Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            { id: "all" as const, label: "All Tracks" },
            { id: "web" as const, label: "Fullstack Web" },
            { id: "mobile" as const, label: "Mobile Apps" },
            { id: "cloud" as const, label: "Cloud & DevOps" },
            { id: "ai" as const, label: "Data & AI" },
            { id: "security" as const, label: "Cyber Security" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedTrackCategory(cat.id)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                selectedTrackCategory === cat.id
                  ? "border-slate-900 bg-slate-900 text-white font-semibold shadow-xs"
                  : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-[var(--shadow-xs)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tracks Grid */}
        <motion.div
          className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredTracks.map((track) => {
            const Icon = track.icon;
            return (
              <motion.div key={track.id} variants={itemVariants} className="h-full">
                <Card className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[var(--shadow-card-hover)] shadow-[var(--shadow-card)]">
                  <div>
                    {/* Header Top Bar */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 transition-colors shadow-[var(--shadow-xs)]">
                        <Icon size={16} className="text-[var(--secondary)]" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" size="sm">
                          {track.level}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {track.moduleCount} Modules
                        </Badge>
                      </div>
                    </div>

                    {/* Track Title & Description */}
                    <div className="mt-3.5 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {track.categoryLabel}
                      </span>
                      <h3 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-primary transition-colors">
                        {track.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-600">{track.description}</p>
                    </div>

                    {/* Skill Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {track.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Capstone Projects Highlight */}
                    <div className="mt-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Award size={12} className="text-[var(--secondary)]" />
                        <span>Shipped Capstone Projects</span>
                      </p>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {track.capstones.map((cap) => (
                          <li key={cap} className="flex items-center gap-1.5 text-[11px]">
                            <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                            <span className="truncate">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Bottom Meta & CTA */}
                  <div className="mt-4 border-t border-slate-200/80 pt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">{track.liveSessions}</span> Live Sessions •{" "}
                      <span className="font-semibold text-[var(--secondary)] font-mono">{track.xpReward} XP</span>
                    </div>

                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                      <span>Enroll</span>
                      <ChevronRight size={13} />
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
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-slate-800 shadow-[var(--shadow-xs)]">
              <Award size={13} className="text-[var(--secondary)]" />
              <span>Engineering Mentors</span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
              Learn Directly From <span className="text-primary">Experienced Engineers</span>
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
              Direct access to staff engineers, system architects, and technical leaders from global and regional
              technology companies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link to="/mentors">
              <Button variant="secondary" size="sm">
                View Mentors
              </Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button size="sm">Apply to Mentor</Button>
            </Link>
          </div>
        </div>

        <motion.div
          className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {FEATURED_MENTORS.map((mentor) => (
            <motion.div key={mentor.id} variants={itemVariants} className="h-full">
              <Card className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[var(--shadow-card-hover)] shadow-[var(--shadow-card)]">
                <div>
                  <div className="flex items-start gap-3.5">
                    <Avatar src="" name={mentor.name} userId={mentor.id} role="mentor" size="md" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-900 text-sm">{mentor.name}</h3>
                        <ShieldCheck size={14} className="text-[var(--secondary)] shrink-0" />
                      </div>
                      <p className="text-xs font-medium text-slate-600">{mentor.role}</p>
                      <p className="text-[11px] text-slate-500">
                        {mentor.company} • {mentor.location}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs italic leading-relaxed text-slate-600">&ldquo;{mentor.quote}&rdquo;</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {mentor.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200/80 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                    <Star size={13} fill="currentColor" />
                    <span>{mentor.score}% Rating</span>
                  </div>
                  <span className="text-slate-500">{mentor.sessions} Sessions Delivered</span>
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-[var(--shadow-card)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-slate-800 shadow-[var(--shadow-xs)]">
                <Globe size={13} className="text-[var(--secondary)]" />
                <span>Regional Tech Hubs</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
                Six Regional Hubs Powering <span className="text-primary">Nationwide Access</span>
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                Physical learning centers in six Ethiopian cities with high-speed internet, power backup, Linux
                workstations, and on-site community leads.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {REGIONAL_HUBS.map((hub) => (
                  <div
                    key={hub.city}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 text-left transition-all hover:border-slate-300 hover:bg-white hover:shadow-[var(--shadow-xs)] shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin size={13} className="text-[var(--secondary)]" />
                      <span className="font-semibold text-slate-900 text-xs">{hub.city}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{hub.hub}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-600">
                      {hub.seats} Seats • {hub.bandwidth}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <Link to="/hubs">
                  <Button variant="secondary" size="sm">
                    <span>View Hubs</span>
                    <ArrowRight size={13} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Community & Hackathons Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-slate-200/80">
                <SmartImage
                  src={LOCAL_MEDIA_ASSETS.events.hackathon}
                  alt="African software engineering team collaborating on laptops covered in developer community stickers during a hackathon sprint"
                  hoverEffect="zoom"
                  className="h-full w-full object-cover"
                  wrapperClassName="h-full w-full border-none bg-transparent"
                  width={800}
                  quality={85}
                />
              </div>
              <div className="p-4 space-y-2.5 pt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <Building2 size={15} className="text-[var(--secondary)]" />
                    <span>Regional Hackathons & Sprints</span>
                  </h3>
                  <Badge variant="secondary" size="sm">
                    Synchronous
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Weekly in-person sprint demos, hackathons, coding competitions, and mentor office hours across all six
                  national hubs.
                </p>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Upcoming Regional Event:</p>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                      Registration Open
                    </span>
                  </div>
                  <p className="text-slate-900 font-medium">National FinTech & AI Systems Hackathon</p>
                  <p className="text-slate-500 text-[11px]">
                    Hosted synchronously across Addis, Bahir Dar, and Hawassa with 1M ETB in project grants.
                  </p>
                </div>
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
          <p className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold">
            Ecosystem Partners
          </p>
          <div className="mt-6 flex flex-wrap justify-center items-center gap-2.5 md:gap-3">
            {PARTNERS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-center transition-all duration-150 hover:border-slate-300 hover:shadow-[var(--shadow-xs)] shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-[var(--bg-card)]"
              >
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.name}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{p.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. HIGH-CONVERSION BOTTOM HERO CTA BANNER
      ────────────────────────────────────────────────────────────── */}
      <section className="page-shell pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[var(--bg-card)] p-6 sm:p-10 shadow-[var(--shadow-card)]"
        >
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 shadow-[var(--shadow-xs)] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />
                Applications Open
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
                Build Ethiopia&apos;s Next <span className="text-primary">Engineering Generation</span>
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium max-w-xl">
                Join {formatCompactCount(activeLearnersCount)}+ developers mastering real-world software engineering
                with live senior mentorship, cloud sandboxes, and direct hiring pathways.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:flex-wrap lg:justify-end">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-medium">
                  <span>Create Student Account</span>
                  <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </Link>
              <Link to="/mentor-recruitment" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-medium">
                  Apply to Mentor
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
