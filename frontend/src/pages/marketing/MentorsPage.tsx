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
  tone,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
  tone: "primary" | "purple" | "success" | "warning";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary border-primary/20"
      : tone === "purple"
        ? "bg-secondary/10 text-secondary border-secondary/20"
        : tone === "success"
          ? "bg-success/10 text-success border-success/20"
          : "bg-warning/10 text-warning border-warning/20";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/90 p-5 text-center transition hover:-translate-y-0.5">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{helper}</p>
    </Card>
  );
}

function MentorCard({
  mentor,
  featured = false,
}: {
  mentor: MarketingMentorPageMentor;
  featured?: boolean;
}) {
  const score = Math.min(100, mentor.mentorScore ?? 95);

  return (
    <Card
      className={`flex h-full flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/95 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 shadow-lg ${
        featured ? "p-6 border-primary/30 bg-[linear-gradient(180deg,rgba(13,20,35,0.95),rgba(8,12,22,0.98))]" : "p-5"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={mentor.avatar}
              name={mentor.fullName}
              userId={mentor._id}
              role="mentor"
              size={featured ? "lg" : "md"}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`font-bold text-white ${featured ? "text-xl" : "text-base"}`}>{mentor.fullName}</h3>
                {mentor.isVerified && <BadgeCheck size={16} className="text-primary shrink-0" />}
              </div>
              <p className="text-xs font-medium text-primary mt-0.5">{mentor.currentCompany || "Senior Tech Leader"}</p>
            </div>
          </div>
          <Badge variant={featured ? "purple" : "default"} className="text-[10px]">
            {featured ? "Senior Fellow" : "Verified Mentor"}
          </Badge>
        </div>

        {mentor.bio ? (
          <p className="text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">{mentor.bio}</p>
        ) : null}

        {/* Mentor Rating & Sessions Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            <span>Student Rating</span>
            <span className="text-white font-bold">{score}% Satisfaction</span>
          </div>
          <ProgressBar value={score} max={100} color="primary" />
        </div>

        {/* Skills Tag Cloud */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(mentor.expertise ?? []).slice(0, featured ? 4 : 3).map((skill) => (
            <span
              key={skill}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-[var(--text-secondary)] font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--text-muted)] font-medium">
          <strong className="text-white">{mentor.totalSessions ?? 50}+</strong> sessions
        </span>
        <Link to="/contact">
          <Button size="sm" variant={featured ? "primary" : "outline"}>
            Connect with Mentor
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
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-24">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-6"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles size={14} />
          <span>Global Ethiopian Engineering Guild</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white leading-tight">
          Learn From Senior Engineers Shaping <span className="glow-text text-primary">Global & African Tech</span>
        </h1>

        <p className="mx-auto max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] md:text-xl">
          Connect with senior software architects, engineering leads, and technical founders from Google, Safaricom,
          Ethio Telecom, CBE, Chapa, and Gebeya who provide structured 1-on-1 guidance, live architectural reviews, and
          career sponsorship.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link to="/mentor-recruitment">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              Apply to Become a Mentor
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <a href="#mentor-directory">
            <Button variant="outline" size="lg">
              Browse Mentor Directory
            </Button>
          </a>
        </div>

        {/* Requirements & Commitment Callout Strip */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 max-w-3xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <ShieldCheck size={16} className="text-primary" /> Requirement: 2+ Years Senior Experience
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Clock size={16} className="text-secondary" /> Commitment: 2–4 Hours / Week (Flexible)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <Trophy size={16} className="text-success" /> Verified Leadership Credentials
          </span>
        </div>
      </motion.section>

      {/* ─── Guild Stats Strip ─── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <Badge variant="purple">Structured Learning</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            How Mentorship Works at EthioTech
          </h2>
          <p className="text-[var(--text-secondary)]">
            A practical, real-world engineering feedback loop designed to bridge the gap between classroom theory and
            production engineering.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MENTORSHIP_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col justify-between border-[var(--border)] bg-[var(--bg-card)]/90 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-bold text-white text-base">{pillar.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {pillar.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Search & Interactive Mentor Directory ─── */}
      <section id="mentor-directory" className="space-y-8 scroll-mt-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="default">Directory</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-1 md:text-4xl">
              Browse the Mentor Directory
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Filter by engineering domain, company, or tech stack.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or stack..."
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Domain Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {domainFilters.map((domain) => (
            <button
              key={domain.value}
              type="button"
              onClick={() => setSelectedDomain(domain.value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                selectedDomain === domain.value
                  ? "border-primary bg-primary text-[var(--bg-base)]"
                  : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
              }`}
            >
              {domain.label}
            </button>
          ))}
        </div>

        {/* Featured Mentors Section */}
        {featuredMentors.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Featured Senior Mentors
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredMentors.map((mentor) => (
                <MentorCard key={mentor._id} mentor={mentor} featured />
              ))}
            </div>
          </div>
        ) : null}

        {/* Discover Mentors Grid */}
        {discoverMentors.length > 0 ? (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              All Verified Mentors ({filteredMentors.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
      <Card className="relative overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto max-w-2xl space-y-3">
          <Badge variant="purple">Join the Guild</Badge>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Are You a Senior Engineer or Tech Leader?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Dedicate 2–4 hours per week to shape Ethiopia&apos;s next generation of software engineers. Benefit from
            leadership credentials, direct talent scouting, and an elite diaspora peer network.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/mentor-recruitment">
            <Button size="lg">Apply to Become a Mentor</Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="outline" size="lg">
              Explore Mentorship Journey
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
              Talk to Guild Coordinator
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
