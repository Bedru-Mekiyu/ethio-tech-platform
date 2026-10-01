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
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
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
import { LOCAL_MEDIA_ASSETS } from "@/config/mediaConfig";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const MENTORSHIP_PILLARS = [
  {
    icon: Code2,
    title: "Line-by-Line Code Reviews",
    description:
      "Mentors provide structured, asynchronous pull request reviews on GitHub, teaching production clean code, design patterns, and test discipline.",
  },
  {
    icon: Video,
    title: "Weekly Office Hours",
    description:
      "Learners book video mentorship slots to untangle complex bugs, discuss system design trade-offs, and receive direct technical guidance.",
  },
  {
    icon: ShieldCheck,
    title: "Capstone Defense Panels",
    description:
      "Students present their graduation capstone architectures in front of a panel of senior mentors, simulating production design reviews.",
  },
  {
    icon: CheckCircle2,
    title: "Career Referrals",
    description:
      "Top-performing graduating students receive direct referrals to engineering managers across our partner employer network.",
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
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
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
  tone?: "primary" | "default" | "warning";
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-4 text-center transition-all hover:border-slate-300 shadow-xs hover:shadow-sm">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[var(--secondary)] dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
        <Icon size={16} />
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 font-mono">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-600">{helper}</p>
    </Card>
  );
}

function MentorCard({ mentor, featured = false }: { mentor: MarketingMentorPageMentor; featured?: boolean }) {
  const score = Math.min(100, mentor.mentorScore ?? 95);

  return (
    <Card
      className={`flex h-full flex-col justify-between rounded-2xl border-slate-200/80 bg-white transition-all hover:border-slate-300 shadow-xs hover:shadow-md ${
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
                <h3 className={`font-bold text-slate-900 ${featured ? "text-sm" : "text-xs"}`}>{mentor.fullName}</h3>
                {mentor.isVerified && <BadgeCheck size={14} className="text-[var(--secondary)] shrink-0" />}
              </div>
              <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                {mentor.currentCompany || "Senior Tech Leader"}
              </p>
            </div>
          </div>
          <Badge
            variant={featured ? "secondary" : "outline"}
            size="sm"
            className={!featured ? "border-slate-200 text-slate-700 font-medium" : undefined}
          >
            {featured ? "Fellow" : "Verified"}
          </Badge>
        </div>

        {mentor.bio ? <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">{mentor.bio}</p> : null}

        {/* Mentor Rating & Sessions Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            <span>Student Rating</span>
            <span className="text-slate-800 font-bold font-mono">{score}% Satisfaction</span>
          </div>
          <ProgressBar
            value={score}
            max={100}
            className="h-1 bg-slate-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300"
          />
        </div>

        {/* Skills Tag Cloud */}
        <div className="flex flex-wrap gap-1 pt-1">
          {(mentor.expertise ?? []).slice(0, featured ? 4 : 3).map((skill) => (
            <span
              key={skill}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-medium">
          <strong className="text-slate-900 font-mono">{mentor.totalSessions ?? 0}</strong> sessions
        </span>
        <Link to="/contact">
          <Button size="sm" variant={featured ? "primary" : "secondary"} className="text-xs font-semibold shadow-xs">
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
    return [...(data?.featuredMentors ?? []), ...(data?.discoverMentors ?? [])];
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
    <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16 lg:px-8 space-y-12 text-slate-900">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-5"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-xs">
          <Users size={13} className="text-[var(--secondary)]" />
          <span>Global Ethiopian Engineering Guild</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 leading-[1.15] break-words">
          Learn From Senior Engineers Shaping <span className="text-primary">Global & African Tech</span>
        </h1>

        <p className="mx-auto max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600 font-normal">
          Connect with senior software architects, engineering leads, and technical founders who provide structured
          1-on-1 guidance, live architectural reviews, and career sponsorship.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
          <Link to="/mentor-recruitment">
            <Button size="md" className="font-semibold shadow-xs">
              Apply to Mentor
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
          <a href="#mentor-directory">
            <Button variant="secondary" size="md" className="font-semibold shadow-xs">
              Browse Directory
            </Button>
          </a>
        </div>

        {/* Requirements & Commitment Callout Strip */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-4 max-w-3xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs text-slate-600 shadow-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldCheck size={14} className="text-[var(--secondary)]" /> Requirement: 2+ Years Senior Experience
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Clock size={14} className="text-[var(--secondary)]" /> Commitment: 2–4 Hours / Week (Flexible)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Trophy size={14} className="text-[var(--secondary)]" /> Verified Leadership Credentials
          </span>
        </div>
      </motion.section>

      {/* ─── Guild Stats Strip ─── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MentorStatCard
          icon={Users}
          value={formatCompactNumber(data?.stats?.totalMentors ?? allMentors.length)}
          label="Senior Mentors"
          helper="Active in the verified guild"
          tone="primary"
        />
        <MentorStatCard
          icon={BadgeCheck}
          value={formatCompactNumber(data?.stats?.verifiedMentors ?? allMentors.filter((m) => m.isVerified).length)}
          label="Verified Practitioners"
          helper="From leading engineering teams"
          tone="default"
        />
        <MentorStatCard
          icon={Video}
          value={formatCompactNumber(
            data?.stats?.totalSessions ?? allMentors.reduce((sum, m) => sum + (m.totalSessions ?? 0), 0),
          )}
          label="Mentorship Sessions"
          helper="Live code reviews & office hours"
          tone="default"
        />
        <MentorStatCard
          icon={Trophy}
          value={
            data?.stats?.averageScore
              ? `${data.stats.averageScore}%`
              : allMentors.length > 0
                ? `${Math.round(allMentors.reduce((sum, m) => sum + (m.mentorScore ?? 95), 0) / allMentors.length)}%`
                : "—"
          }
          label="Student Rating"
          helper="Consistently high quality standard"
          tone="warning"
        />
      </section>

      {/* ─── The Mentorship Framework ─── */}
      <section className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-4">
            <Badge variant="secondary">Structured Learning</Badge>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl break-words">
              How Mentorship Works at EthioTech
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              EthioTech connects software engineering students with senior practitioners and industry leads across
              global and regional tech ecosystems. Every interaction is structured around real codebases, asynchronous
              GitHub PR feedback, and high-leverage architectural review.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                <p className="text-xs font-bold text-slate-900">Weekly Office Hours</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct 1-on-1 screen share and architectural deep dives.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
                <p className="text-xs font-bold text-slate-900">PR Line-by-Line Audits</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enterprise standards for idiomatic code, tests, and security.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-xs dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
              <SmartImage
                src={LOCAL_MEDIA_ASSETS.mentorship.codeReview}
                alt="Senior African software engineer conducting a pair programming code review session with a developer over dual monitors"
                aspectRatio="aspect-[4/3]"
                className="w-full object-cover"
              />
              <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Personalized code review and technical career mentoring</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENTORSHIP_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col justify-between rounded-2xl border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 text-sm">{pillar.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{pillar.description}</p>
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
            <Badge variant="secondary">Directory</Badge>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl mt-1 break-words">
              Browse the Mentor Directory
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Filter by engineering domain, company, or tech stack.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or stack..."
              className="pl-9 h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-slate-400 rounded-xl"
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
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                selectedDomain === domain.value
                  ? "border-slate-900 bg-slate-900 text-white shadow-xs font-semibold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs"
              }`}
            >
              {domain.label}
            </button>
          ))}
        </div>

        {allMentors.length === 0 ? (
          <EmptyState
            eyebrow="Mentor Guild"
            title="No mentors registered yet"
            description="Our mentor network is currently accepting applications from senior engineers and tech leads."
            actionLabel="Apply to Mentor"
            actionHref="/mentor-recruitment"
          />
        ) : filteredMentors.length === 0 ? (
          <EmptyState
            eyebrow="Filter Results"
            title="No matching mentors found"
            description="Try adjusting your search query or specialty filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery("");
              setSelectedDomain("all");
            }}
          />
        ) : (
          <>
            {featuredMentors.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Featured Senior Mentors
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {featuredMentors.map((mentor) => (
                    <MentorCard key={mentor._id} mentor={mentor} featured />
                  ))}
                </div>
              </div>
            ) : null}

            {discoverMentors.length > 0 ? (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  All Verified Mentors ({filteredMentors.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {discoverMentors.map((mentor) => (
                    <MentorCard key={mentor._id} mentor={mentor} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* ─── Bottom CTA Banner ─── */}
      <Card className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 text-center space-y-4 shadow-sm">
        <div className="mx-auto max-w-2xl space-y-2">
          <Badge variant="secondary">Join the Guild</Badge>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl break-words">
            Are You a Senior Engineer?
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Dedicate 2–4 hours weekly to guide Ethiopian software engineers, conduct code reviews, and build hiring
            connections.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 pt-2">
          <Link to="/mentor-recruitment">
            <Button size="md" className="font-semibold shadow-xs">
              Apply to Mentor
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="secondary" size="md" className="font-semibold shadow-xs">
              View Workflow
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="md" className="text-slate-700 hover:text-slate-900 font-medium">
              Contact Guild
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
