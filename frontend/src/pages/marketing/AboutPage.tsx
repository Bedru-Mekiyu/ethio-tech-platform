import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Flame,
  Globe,
  GraduationCap,
  Layers3,
  MapPin,
  MapPinned,
  Radio,
  ShieldCheck,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { fetchMarketingAbout, type MarketingAboutData } from "@/services/marketingService";
import { useQuery } from "@tanstack/react-query";
import { LOCAL_MEDIA_ASSETS } from "@/config/mediaConfig";

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
    subtitle: "Engineering mentorship delivered locally",
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
      "Scaling curriculum tracks across East Africa, launching edge learning nodes, and partnering with global enterprises for direct hiring pipelines.",
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
  const [roadmapFilter, setRoadmapFilter] = useState<"all" | "completed" | "in-progress" | "planned">("all");

  const { data } = useQuery<MarketingAboutData>({
    queryKey: ["marketing", "about"],
    queryFn: fetchMarketingAbout,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

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
    <div className="relative min-h-screen text-[var(--text-primary)] overflow-hidden">
      {/* Luminous Ambient Background Glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(185,28,28,0.04),rgba(30,58,138,0.03),transparent_70%)] dark:opacity-20"
        aria-hidden="true"
      />

      {/* ─── Hero Section ─── */}
      <motion.section
        className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 mb-4 shadow-[var(--shadow-xs)] backdrop-blur-xs">
            <Zap size={13} className="text-[var(--secondary)]" />
            <span>The Ethiopian Software Engineering Movement</span>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-[2.65rem] font-bold leading-[1.15] tracking-tight text-slate-900 break-words">
            Engineering Education Built for <span className="text-primary">Ethiopian Developers</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600 font-normal">
            Tuition-free learning combining diaspora mentorship, in-browser Linux environments, peer code reviews, and
            physical regional hubs across Ethiopia.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="font-medium w-full sm:w-auto">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button variant="secondary" size="lg" className="font-medium w-full sm:w-auto">
                <Users className="mr-2 h-4 w-4 text-[var(--secondary)]" /> Become a Mentor
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                const el = document.getElementById("delivery-architecture");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              View Architecture
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-slate-600">
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
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-[var(--shadow-xs)]"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--secondary)]" />
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
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[var(--shadow-card-hover)] shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{stat.label}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{stat.helper}</p>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-0.5 text-xs font-semibold text-slate-800 mb-3 shadow-[var(--shadow-xs)]">
            <span>National Context & Strategic Imperative</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
            Unlocking Ethiopia’s <span className="text-primary">Demographic Dividend</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
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
                className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-card-hover)] shadow-[var(--shadow-card)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                  <Icon size={18} />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{fact.metric}</p>
                <h3 className="mt-0.5 text-sm font-semibold text-slate-900">{fact.label}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">{fact.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Regional Divide vs Scaled Solution */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-amber-700">
                <Flame size={18} />
                <h3 className="text-base font-semibold text-slate-900">The Theory vs. Practice Chasm</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                Most university students graduate having completed blackboard algorithms and single-page textbook
                projects. Real software engineering requires git branching workflows, automated CI/CD pipelines, Docker
                containers, and high-availability system architecture.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
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

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-slate-800">
                <ShieldCheck size={18} className="text-[var(--secondary)]" />
                <h3 className="text-base font-semibold text-slate-900">How EthioTech Solves This</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                EthioTech provides a continuous software development lifecycle right in the browser and across our
                physical regional hubs. Students push real code, receive automated CI test feedback in seconds, and
                review code with senior mentors.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" size="sm">
                  100% Practical Labs
                </Badge>
                <Badge variant="secondary" size="sm">
                  Automated CI Pipelines
                </Badge>
                <Badge variant="secondary" size="sm">
                  Production Git Pull Requests
                </Badge>
                <Badge variant="secondary" size="sm">
                  Verifiable Skill Passports
                </Badge>
              </div>
            </div>
          </div>

          {/* Regional Solutions Cards */}
          <div className="space-y-3.5">
            <h3 className="text-base font-semibold text-slate-900">Overcoming the Regional Digital Divide</h3>
            <p className="text-xs text-slate-600">
              We design specifically for Ethiopian infrastructure, ensuring learners in every region enjoy an
              uncompromising learning experience.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {REGIONAL_DIVIDE_SOLUTIONS.map((sol) => {
                const Icon = sol.icon;
                return (
                  <Card
                    key={sol.title}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-150 hover:border-slate-300 hover:shadow-[var(--shadow-xs)] shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                        <Icon size={15} />
                      </div>
                      <Badge variant="outline" size="sm">
                        {sol.tag}
                      </Badge>
                    </div>
                    <h4 className="mt-2 text-xs font-semibold text-slate-900">{sol.title}</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">{sol.subtitle}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{sol.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Mission, Vision & Community Bridge ─── */}
      <motion.section
        id="delivery-architecture"
        className="mx-auto max-w-7xl px-4 py-12 lg:py-14 lg:px-8 scroll-mt-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                <Target size={20} />
              </div>
              <Badge variant="secondary">Our Mission</Badge>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Engineering Mission</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Democratize production software engineering education across Ethiopia through tuition-free curriculum,
              live diaspora mentorship, and regional tech hubs.
            </p>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                <Compass size={20} />
              </div>
              <Badge variant="secondary">Our Vision</Badge>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Long-Term Vision</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Establish Ethiopia as a regional software engineering hub, placing certified developers into global
              engineering teams and pan-African technology companies.
            </p>
          </Card>
        </div>

        {/* National Delivery Architecture Showcase */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--secondary)] animate-pulse" />
                <span className="text-xs font-semibold text-slate-900">National Delivery Architecture</span>
              </div>
              <Badge variant="secondary" size="sm">
                4-Tier Distributed System
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">1. Regional Hub Network</span>
                  <span className="text-[11px] text-slate-500 font-medium">Physical Mesh</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Dedicated computer labs with backup power, local caches, and fiber internet across 6 university
                  cities.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">2. In-Browser WASM Runtime</span>
                  <span className="text-[11px] text-slate-500 font-medium">Edge Compute</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Zero-install developer environment running locally via WebAssembly, resilient to network drops.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">3. Diaspora Mentorship Mesh</span>
                  <span className="text-[11px] text-slate-500 font-medium">Global Network</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Weekly code reviews and async architecture feedback from Ethiopian staff engineers worldwide.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">4. Talent Verification Gateway</span>
                  <span className="text-[11px] text-slate-500 font-medium">Verifiable Proof</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Cryptographically verifiable skill passports backed by production git commits and peer reviews.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Sovereign Tech Talent Infrastructure</span>
              <span className="font-medium text-slate-700">100% Free & Open Access</span>
            </div>
          </Card>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-0.5 text-xs font-semibold text-slate-800 mb-2 shadow-[var(--shadow-xs)]">
              <span>National Impact Model</span>
            </div>
            <h3 className="text-xl font-bold leading-tight sm:text-2xl text-slate-900">
              {data?.bridge.title ?? "Bridging the Gap from Campus to Cloud"}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {data?.bridge.description ??
                "EthioTech operates as an open-impact digital public good. We bridge the structural divide by linking university classrooms directly to diaspora tech leads and production codebases."}
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[var(--shadow-card)] dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
              <SmartImage
                src={LOCAL_MEDIA_ASSETS.community.classroom}
                alt="University technology classroom connecting students directly with hands-on software curriculum"
                aspectRatio="aspect-[16/9]"
                className="w-full object-cover"
              />
              <div className="border-t border-slate-200/80 bg-slate-50 px-3.5 py-2.5">
                <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Campus-to-cloud engineering cohorts across Ethiopian universities</span>
                </p>
              </div>
            </div>

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
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 transition hover:border-slate-300"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-2xs">
                      <Icon size={14} />
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700">{bullet}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2.5">
              <Link to="/how-it-works">
                <Button variant="secondary" size="sm">
                  See the 5-Stage Journey <ArrowRight size={13} className="ml-1.5" />
                </Button>
              </Link>
              <Link to="/hubs">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 font-medium">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-0.5 text-xs font-semibold text-slate-800 mb-3 shadow-[var(--shadow-xs)]">
            <span>Trajectory & Execution</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl break-words">
            Platform Roadmap & Milestones
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal">
            Our multi-year blueprint scaling Ethiopia's digital software engineering infrastructure.
          </p>

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {(["all", "completed", "in-progress", "planned"] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setRoadmapFilter(filterKey)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  roadmapFilter === filterKey
                    ? "border border-slate-900 bg-slate-900 text-white font-semibold shadow-xs"
                    : "border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-[var(--shadow-xs)]"
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
              completed: { badge: "Completed", variant: "default" as const, dotColor: "bg-emerald-600" },
              "in-progress": {
                badge: "Current Phase",
                variant: "secondary" as const,
                dotColor: "bg-[var(--secondary)]",
              },
              planned: { badge: "Planned", variant: "outline" as const, dotColor: "bg-slate-400" },
            }[item.status];

            return (
              <Card
                key={item.phase}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-150 hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-900">{item.phase}</span>
                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.badge}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{item.year}</span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>

                <div className="mt-3.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Key Deliverables & Milestones
                  </h4>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {item.deliverables.map((deliv) => (
                      <div key={deliv} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
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
      <section className="border-t border-slate-200/80 bg-slate-50/50 dark:bg-slate-900/50 py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-0.5 text-xs font-semibold text-slate-800 mb-3 shadow-[var(--shadow-xs)]">
              <span>Institutional Trust</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl break-words">
              Governance & Open Impact Model
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 font-normal">
              EthioTech is operated as a transparent, non-profit digital public good dedicated to long-term national
              capacity building.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                <BookOpen size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">100% Open Source Syllabus</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                All curriculum outlines, project boilerplate repositories, and testing suites are published under open
                permissive licenses (MIT / CC-BY-4.0). Any university or student can inspect or fork improvements.
              </p>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                <ShieldCheck size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Ethical Philanthropic Model</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                We operate free from extractive investor incentives. Funding is derived exclusively from diaspora tech
                philanthropy, educational grants, and CSR partnerships. No student is ever charged tuition.
              </p>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50/70 text-[var(--secondary)] border border-blue-200/60 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300 shadow-[var(--shadow-xs)]">
                <ShieldCheck size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Transparent Impact Auditing</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                We maintain a telemetry reporting system documenting active cohorts, PR merge volumes, mentor volunteer
                hours, and verified career placements. Every metric is audited and verifiable.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-14 pt-6 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[var(--bg-card)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-800 mb-2.5 shadow-[var(--shadow-xs)]">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />
                <span>Join the Movement</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl break-words">
                Ready to transform your engineering trajectory?
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium sm:text-sm">
                Whether you are a university student building production systems or a diaspora engineer guiding emerging
                talent, EthioTech provides the platform.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto font-medium">
                  Enroll Free
                </Button>
              </Link>
              <Link to="/mentor-recruitment">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-medium">
                  Become a Mentor
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto text-slate-700 hover:text-slate-900 font-medium"
                >
                  View Workflow <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
