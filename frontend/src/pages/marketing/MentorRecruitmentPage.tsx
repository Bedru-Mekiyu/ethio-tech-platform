import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
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
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchMarketingMentors,
  type MarketingMentorPageData,
  type MarketingMentorPageMentor,
} from "@/services/marketingService";

type MentorFilter = "all" | string;

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

function MentorSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Skeleton className="mx-auto h-6 w-44 rounded-full" />
        <Skeleton className="mx-auto mt-5 h-14 w-full max-w-4xl" />
        <Skeleton className="mx-auto mt-4 h-5 w-full max-w-3xl" />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </div>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <Skeleton className="h-80 rounded-[28px]" />
        <Skeleton className="h-80 rounded-[28px]" />
        <Skeleton className="h-80 rounded-[28px]" />
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-60 rounded-[24px]" />
        <Skeleton className="h-60 rounded-[24px]" />
        <Skeleton className="h-60 rounded-[24px]" />
        <Skeleton className="h-60 rounded-[24px]" />
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
      ? "bg-primary/10 text-primary"
      : tone === "purple"
        ? "bg-secondary/10 text-secondary"
        : tone === "success"
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning";

  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5 text-center">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p>
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
  const score = Math.min(100, mentor.mentorScore ?? 0);

  return (
    <Card
      className={`flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 ${
        featured ? "p-6" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <Avatar src={mentor.avatar} name={mentor.fullName} size={featured ? "lg" : "md"} />
          {mentor.isVerified ? (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-success/25 bg-success/15 text-success">
              <BadgeCheck size={14} />
            </span>
          ) : null}
        </div>
        <Badge variant={featured ? "purple" : "default"}>{featured ? "Featured mentor" : "Mentor"}</Badge>
      </div>

      <div className="space-y-1">
        <h3 className={`font-semibold text-white ${featured ? "text-2xl" : "text-lg"}`}>
          {mentor.fullName}
        </h3>
        <p className="text-sm text-primary">{mentor.currentCompany || "Independent mentor"}</p>
        <p className="text-xs text-[var(--text-muted)]">{mentor.totalSessions ?? 0} sessions delivered</p>
      </div>

      {mentor.bio ? (
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{mentor.bio}</p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <span>Mentor score</span>
          <span>{score}%</span>
        </div>
        <ProgressBar value={score} max={100} color="primary" />
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          {(mentor.expertise ?? []).slice(0, featured ? 4 : 3).map((skill) => (
            <Badge key={skill} variant="purple">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/contact">
            <Button variant="outline" size={featured ? "lg" : "md"}>
              Connect
            </Button>
          </Link>
          <Link to="/how-it-works" className="inline-flex items-center text-sm text-primary hover:underline">
            See mentorship flow
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function MentorRecruitmentPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MentorFilter>("all");

  const { data, isLoading, isError, error, refetch } = useQuery<MarketingMentorPageData>({
    queryKey: ["marketing", "mentors"],
    queryFn: fetchMarketingMentors,
  });

  const mentors = useMemo(() => {
    const allMentors = [...(data?.featuredMentors ?? []), ...(data?.discoverMentors ?? [])];
    return filter === "all"
      ? allMentors
      : allMentors.filter((mentor) =>
          (mentor.expertise ?? []).some((skill) => skill.trim().toLowerCase() === filter)
        );
  }, [data, filter]);

  const featured = data?.featuredMentors ?? [];
  const featuredIds = new Set(featured.map((mentor) => mentor._id));
  const discover = mentors.filter((mentor) => !featuredIds.has(mentor._id));

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
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <motion.section
        className="mx-auto max-w-4xl text-center"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <Badge className="mb-5">{data?.hero.eyebrow ?? "Global mentor network"}</Badge>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          {data?.hero.title ?? "Learn from the Best in Global Technology"}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
          {data?.hero.description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register?role=mentor">
            <Button size="lg">Become a mentor</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" size="lg">
              Talk to the team
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-[var(--text-secondary)]">
          {(data?.hero.highlights ?? []).map((item) => (
            <span key={item} className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-2">
              {item}
            </span>
          ))}
        </div>
      </motion.section>

      <section className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MentorStatCard
          icon={Users}
          value={formatCompactNumber(data?.stats.totalMentors ?? 0)}
          label="Mentors"
          helper="Active in the public network"
          tone="primary"
        />
        <MentorStatCard
          icon={BadgeCheck}
          value={formatCompactNumber(data?.stats.verifiedMentors ?? 0)}
          label="Verified"
          helper="Trusted and reviewed mentors"
          tone="purple"
        />
        <MentorStatCard
          icon={Video}
          value={formatCompactNumber(data?.stats.totalSessions ?? 0)}
          label="Sessions"
          helper="Live sessions delivered"
          tone="success"
        />
        <MentorStatCard
          icon={Trophy}
          value={`${data?.stats.averageScore ?? 0}%`}
          label="Average score"
          helper="Quality signal across mentors"
          tone="warning"
        />
      </section>

      <section className="mt-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Featured Global Mentors</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Mentors who combine skill, clarity, and care.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Start with the strongest mentors in the network, then browse the wider community by expertise
              and teaching style.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data?.filters ?? []).slice(0, 6).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  filter === item.value
                    ? "border-primary bg-primary text-[var(--bg-base)]"
                    : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {featured.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featured.map((mentor) => (
              <MentorCard key={mentor._id} mentor={mentor} featured />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="Featured mentors are loading"
              description="As mentor data becomes available, the featured section will populate automatically."
              actionLabel="Become a mentor"
              onAction={() => navigate("/register?role=mentor")}
            />
          </div>
        )}
      </section>

      <section className="mt-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4">Discover Mentors</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Explore the full mentor ecosystem.</h2>
          </div>
          <p className="max-w-2xl text-[var(--text-secondary)]">
            Pick a specialty, scan the profiles, and connect with mentors who fit the way you want to learn.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {(data?.filters ?? []).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
                filter === item.value
                  ? "border-secondary bg-secondary text-white"
                  : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
              }`}
            >
              {item.label} · {item.count}
            </button>
          ))}
        </div>

        {discover.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {discover.map((mentor) => (
              <MentorCard key={mentor._id} mentor={mentor} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="No mentors match this filter"
              description="Try switching back to All mentors or choose a broader expertise."
              actionLabel="Show all mentors"
              onAction={() => setFilter("all")}
            />
          </div>
        )}
      </section>

      <Card className="mt-16 overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge className="mb-4">Mentor impact</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">{data?.cta.title}</h2>
            <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">{data?.cta.description}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <Link to={data?.cta.primary.to ?? "/register?role=mentor"}>
              <Button size="lg">{data?.cta.primary.label ?? "Apply as a mentor"}</Button>
            </Link>
            <Link to={data?.cta.secondary.to ?? "/contact"}>
              <Button variant="outline" size="lg">
                {data?.cta.secondary.label ?? "Talk to the team"}
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
                Learn about EthioTech
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
