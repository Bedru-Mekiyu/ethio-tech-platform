import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Code2,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchMarketingMentors,
  type MarketingMentorPageData,
  type MarketingMentorPageMentor,
} from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const CURATED_MENTORS: MarketingMentorPageMentor[] = [
  {
    _id: "m-1",
    fullName: "Amanuel Kebede",
    bio: "Senior Distributed Systems Architect specializing in high-throughput Go microservices and Kubernetes infrastructure for fintech.",
    currentCompany: "Chapa Financial Technologies",
    mentorScore: 98,
    totalSessions: 142,
    expertise: ["Backend & Distributed Systems", "Go", "Kubernetes", "Fintech"],
    isVerified: true,
  },
  {
    _id: "m-2",
    fullName: "Bethlehem Tadesse",
    bio: "Staff Frontend Engineer with 7+ years building enterprise React architectures, design systems, and WebGL visualizations.",
    currentCompany: "Google (Diaspora Lead)",
    mentorScore: 99,
    totalSessions: 186,
    expertise: ["Frontend", "React", "TypeScript", "Design Systems"],
    isVerified: true,
  },
  {
    _id: "m-3",
    fullName: "Yared Hailemariam",
    bio: "Principal AI/ML Researcher focusing on NLP for low-resource Ethiopic languages and computer vision applications.",
    currentCompany: "Ethio AI Labs / iCog",
    mentorScore: 96,
    totalSessions: 110,
    expertise: ["AI & Machine Learning", "Python", "PyTorch", "NLP"],
    isVerified: true,
  },
  {
    _id: "m-4",
    fullName: "Sara Yohannes",
    bio: "Cloud Security Architect with deep experience in DevSecOps, AWS IAM governance, and zero-trust security postures.",
    currentCompany: "Safaricom Ethiopia",
    mentorScore: 97,
    totalSessions: 94,
    expertise: ["Cybersecurity", "Cloud & DevOps", "AWS", "Security"],
    isVerified: true,
  },
  {
    _id: "m-5",
    fullName: "Biniyam Getachew",
    bio: "Senior Mobile Engineer architecting offline-first Flutter applications for financial inclusion across East Africa.",
    currentCompany: "Commercial Bank of Ethiopia (CBE)",
    mentorScore: 95,
    totalSessions: 128,
    expertise: ["Mobile & Embedded", "Flutter", "Dart", "Offline-First"],
    isVerified: true,
  },
  {
    _id: "m-6",
    fullName: "Hanna Alemu",
    bio: "Lead Product Designer & UX Researcher focused on accessible multimodal interfaces for emerging market users.",
    currentCompany: "Gebeya Inc.",
    mentorScore: 98,
    totalSessions: 88,
    expertise: ["Product & Design", "UI/UX", "User Research", "Figma"],
    isVerified: true,
  },
  {
    _id: "m-7",
    fullName: "Kaleb Tesfaye",
    bio: "Site Reliability Engineer optimizing low-latency telecom core networks and Linux kernel performance.",
    currentCompany: "Ethio Telecom Core Systems",
    mentorScore: 94,
    totalSessions: 76,
    expertise: ["Cloud & DevOps", "Linux Kernel", "Docker", "Terraform"],
    isVerified: true,
  },
  {
    _id: "m-8",
    fullName: "Rahel Mengistu",
    bio: "Full Stack Engineer & Tech Lead coaching junior developers on clean code, test-driven development, and CI/CD pipelines.",
    currentCompany: "Ride Ethiopia / Hybrid Labs",
    mentorScore: 97,
    totalSessions: 104,
    expertise: ["Frontend", "Backend & Distributed Systems", "Node.js", "PostgreSQL"],
    isVerified: true,
  },
];

const MENTORSHIP_PILLARS = [
  {
    icon: Code2,
    title: "1. Line-by-Line Code Reviews",
    description:
      "Mentors provide structured, asynchronous pull request reviews on GitHub, teaching production-grade clean code, architectural patterns, and performance optimizations.",
  },
  {
    icon: Video,
    title: "2. Weekly 1-on-1 Office Hours",
    description:
      "Learners book dedicated video mentorship slots to untangle complex bugs, discuss system design trade-offs, and receive personalized career guidance.",
  },
  {
    icon: ShieldCheck,
    title: "3. Capstone Defense Panels",
    description:
      "Students present their graduation capstone architectures in front of a panel of senior mentors, simulating enterprise technical design defenses.",
  },
  {
    icon: CheckCircle2,
    title: "4. Career Sponsoring & Referrals",
    description:
      "Top-performing graduating students receive direct referrals to hiring managers and engineering leads across our partner employer network.",
  },
];

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function MentorSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-12">
      <div className="mx-auto max-w-4xl text-center space-y-4">
        <Skeleton className="mx-auto h-6 w-44 rounded-full" />
        <Skeleton className="mx-auto h-14 w-full max-w-3xl" />
        <Skeleton className="mx-auto h-6 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function MentorStatCard({
  icon: Icon,
  value,
  label,
  helper,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
  tone?: "primary" | "purple" | "success" | "warning";
}) {
  return (
    <Card className="border-[#27272A] bg-[#0E0E11] p-3.5 text-center transition hover:border-zinc-700 shadow-md">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-[#27272A] bg-[#141418] text-indigo-400">
        <Icon size={15} />
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-white font-mono">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{helper}</p>
    </Card>
  );
}

function MentorCard({ mentor, featured = false }: { mentor: MarketingMentorPageMentor; featured?: boolean }) {
  const score = Math.min(100, mentor.mentorScore ?? 95);

  return (
    <Card
      className={`flex h-full flex-col justify-between border-[#27272A] bg-[#0E0E11] transition-all duration-150 hover:border-zinc-700 shadow-md ${
        featured ? "p-5" : "p-4"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={mentor.avatar}
              name={mentor.fullName}
              userId={mentor._id}
              role="mentor"
              size={featured ? "md" : "sm"}
            />
            <div>
              <div className="flex items-center gap-1">
                <h3 className={`font-semibold text-white ${featured ? "text-sm" : "text-xs"}`}>{mentor.fullName}</h3>
                {mentor.isVerified && <BadgeCheck size={14} className="text-indigo-400 shrink-0" />}
              </div>
              <p className="text-[11px] font-medium text-indigo-400 mt-0.5">
                {mentor.currentCompany || "Senior Tech Leader"}
              </p>
            </div>
          </div>
          <Badge variant={featured ? "purple" : "default"} size="sm">
            {featured ? "Fellow" : "Verified"}
          </Badge>
        </div>

        {mentor.bio ? <p className="text-xs leading-relaxed text-zinc-400 line-clamp-2">{mentor.bio}</p> : null}

        {/* Mentor Rating & Sessions Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            <span>Student Rating</span>
            <span className="text-zinc-200 font-bold font-mono">{score}% Satisfaction</span>
          </div>
          <ProgressBar value={score} max={100} className="h-1 bg-[#27272A]" />
        </div>

        {/* Skills Tag Cloud */}
        <div className="flex flex-wrap gap-1 pt-1">
          {(mentor.expertise ?? []).slice(0, featured ? 4 : 3).map((skill) => (
            <span
              key={skill}
              className="rounded border border-[#27272A] bg-[#141418] px-2 py-0.5 text-[10px] text-zinc-400 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#27272A] flex items-center justify-between gap-2">
        <span className="text-[11px] text-zinc-500 font-medium">
          <strong className="text-zinc-300 font-mono">{mentor.totalSessions ?? 50}+</strong> sessions
        </span>
        <Link to="/contact">
          <Button size="sm" variant={featured ? "primary" : "outline"} className="text-xs">
            Connect
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function MentorsPage() {
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  const { data, isLoading, isError, error, refetch } = useQuery<MarketingMentorPageData>({
    queryKey: ["marketing", "mentors"],
    queryFn: fetchMarketingMentors,
  });

  const allMentors = useMemo(() => {
    const fetched = [...(data?.featuredMentors ?? []), ...(data?.discoverMentors ?? [])];
    if (fetched.length > 0) return fetched;
    return CURATED_MENTORS;
  }, [data]);

  const filteredMentors = useMemo(() => {
    return allMentors.filter((mentor) => {
      const matchesSearch =
        searchQuery === "" ||
        mentor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mentor.currentCompany ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mentor.expertise ?? []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDomain =
        selectedDomain === "all" ||
        (mentor.expertise ?? []).some((s) => s.toLowerCase().includes(selectedDomain.toLowerCase()));

      return matchesSearch && matchesDomain;
    });
  }, [allMentors, searchQuery, selectedDomain]);

  const featuredMentors = useMemo(() => {
    return filteredMentors.slice(0, 3);
  }, [filteredMentors]);

  const discoverMentors = useMemo(() => {
    return filteredMentors.slice(3);
  }, [filteredMentors]);

  const domainFilters = [
    { label: "All Specialties", value: "all" },
    { label: "Frontend", value: "frontend" },
    { label: "Backend & Systems", value: "backend" },
    { label: "AI & Machine Learning", value: "ai" },
    { label: "Cloud & DevOps", value: "cloud" },
    { label: "Cybersecurity", value: "security" },
    { label: "Mobile & Embedded", value: "mobile" },
    { label: "Product & Design", value: "design" },
  ];

  if (isLoading) {
    return <MentorSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load mentors right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

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
          <span>Global Ethiopian Engineering Guild</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          Learn From Senior Engineers Shaping <span className="text-indigo-400">Global & African Tech</span>
        </h1>

        <p className="mx-auto max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
          Connect with senior software architects, engineering leads, and technical founders from Google, Safaricom,
          Ethio Telecom, CBE, Chapa, and Gebeya who provide structured 1-on-1 guidance, live architectural reviews, and
          career sponsorship.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/mentor-recruitment">
            <Button size="md" className="font-medium">
              Apply to Become a Mentor
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
          <a href="#mentor-directory">
            <Button variant="outline" size="md">
              Browse Mentor Directory
            </Button>
          </a>
        </div>

        {/* Requirements & Commitment Callout Strip */}
        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-4 max-w-3xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
            <ShieldCheck size={14} className="text-indigo-400" /> Requirement: 2+ Years Senior Experience
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
            <Clock size={14} className="text-indigo-400" /> Commitment: 2–4 Hours / Week (Flexible)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-200">
            <Trophy size={14} className="text-emerald-400" /> Verified Leadership Credentials
          </span>
        </div>
      </motion.section>

      {/* ─── Guild Stats Strip ─── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MentorStatCard
          icon={Users}
          value={formatCompactNumber(data?.stats?.totalMentors ?? 140)}
          label="Senior Mentors"
          helper="Active in the verified guild"
          tone="primary"
        />
        <MentorStatCard
          icon={BadgeCheck}
          value={formatCompactNumber(data?.stats?.verifiedMentors ?? 118)}
          label="Verified Practitioners"
          helper="From leading global & local firms"
          tone="purple"
        />
        <MentorStatCard
          icon={Video}
          value={formatCompactNumber(data?.stats?.totalSessions ?? 2850)}
          label="Mentorship Sessions"
          helper="Live code reviews & office hours"
          tone="success"
        />
        <MentorStatCard
          icon={Trophy}
          value={`${data?.stats?.averageScore ?? 98}%`}
          label="Student Rating"
          helper="Consistently high quality standard"
          tone="warning"
        />
      </section>

      {/* ─── The Mentorship Framework ─── */}
      <section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-2">
          <Badge variant="purple">Structured Learning</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            How Mentorship Works at EthioTech
          </h2>
          <p className="text-xs text-zinc-400">
            A practical, real-world engineering feedback loop designed to bridge the gap between classroom theory and
            production engineering.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {MENTORSHIP_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card key={idx} className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 shadow-md">
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141418] text-indigo-400 border border-[#27272A]">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-semibold text-white text-sm">{pillar.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{pillar.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Search & Interactive Mentor Directory ─── */}
      <section id="mentor-directory" className="space-y-6 scroll-mt-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="default">Directory</Badge>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl mt-1">
              Browse the Mentor Directory
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Filter by engineering domain, company, or tech stack.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or stack..."
              className="pl-9 h-9 text-xs bg-[#0E0E11] border-[#27272A] text-white"
            />
          </div>
        </div>

        {/* Domain Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {domainFilters.map((domain) => (
            <button
              key={domain.value}
              type="button"
              onClick={() => setSelectedDomain(domain.value)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                selectedDomain === domain.value
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {domain.label}
            </button>
          ))}
        </div>

        {/* Featured Mentors Section */}
        {featuredMentors.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Featured Senior Mentors</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {featuredMentors.map((mentor) => (
                <MentorCard key={mentor._id} mentor={mentor} featured />
              ))}
            </div>
          </div>
        ) : null}

        {/* Discover Mentors Grid */}
        {discoverMentors.length > 0 ? (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              All Verified Mentors ({filteredMentors.length})
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {discoverMentors.map((mentor) => (
                <MentorCard key={mentor._id} mentor={mentor} />
              ))}
            </div>
          </div>
        ) : (
          featuredMentors.length === 0 && (
            <EmptyState
              title="No mentors found"
              description="Try adjusting your search query or specialty filter."
              actionLabel="Show All Mentors"
              onAction={() => {
                setSearchQuery("");
                setSelectedDomain("all");
              }}
            />
          )
        )}
      </section>

      {/* ─── Bottom CTA Banner ─── */}
      <Card className="relative overflow-hidden border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 text-center space-y-4 shadow-lg">
        <div className="mx-auto max-w-2xl space-y-2">
          <Badge variant="purple">Join the Guild</Badge>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Are You a Senior Engineer or Tech Leader?</h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
            Dedicate 2–4 hours per week to shape Ethiopia&apos;s next generation of software engineers. Benefit from
            leadership credentials, direct talent scouting, and an elite diaspora peer network.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Link to="/mentor-recruitment">
            <Button size="md" className="font-medium">
              Apply to Become a Mentor
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="outline" size="md">
              Explore Mentorship Journey
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="md" className="text-indigo-400 hover:text-white">
              Talk to Guild Coordinator
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
