import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Code2,
  Cpu,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { MEDIA_CATEGORIES } from "@/config/mediaConfig";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMarketingHome, type MarketingTrack, type MarketingMentor } from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const trackPalette = {
  awareness: { icon: Sparkles, accent: "text-secondary", badge: "purple" as const },
  beginner: { icon: Code2, accent: "text-primary", badge: "default" as const },
  intermediate: { icon: Cpu, accent: "text-success", badge: "success" as const },
  advanced: { icon: ShieldCheck, accent: "text-warning", badge: "warning" as const },
};

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function formatTrackCategory(category?: string) {
  if (!category) return "Program";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getTrackMeta(track: MarketingTrack) {
  const normalized = (track.category || "").toLowerCase();
  if (normalized in trackPalette) {
    return trackPalette[normalized as keyof typeof trackPalette];
  }

  const title = track.title.toLowerCase();
  if (title.includes("ai") || title.includes("data")) return { icon: Bot, accent: "text-secondary", badge: "purple" as const };
  if (title.includes("cyber") || title.includes("security")) {
    return { icon: ShieldCheck, accent: "text-warning", badge: "warning" as const };
  }
  if (title.includes("full") || title.includes("stack") || title.includes("web")) {
    return { icon: Code2, accent: "text-primary", badge: "default" as const };
  }
  return { icon: MonitorPlay, accent: "text-success", badge: "success" as const };
}

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-5">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-16 w-full max-w-[28rem]" />
          <Skeleton className="h-16 w-full max-w-[34rem]" />
          <Skeleton className="h-5 w-full max-w-[30rem]" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-[28px]" />
      </div>
      <Skeleton className="mt-10 h-32 w-full rounded-[28px]" />
      <div className="mt-16 space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-10 w-full max-w-[26rem]" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-[24px]" />
          <Skeleton className="h-64 rounded-[24px]" />
          <Skeleton className="h-64 rounded-[24px]" />
        </div>
      </div>
      <div className="mt-16 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-full max-w-[32rem]" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-56 rounded-[24px]" />
          <Skeleton className="h-56 rounded-[24px]" />
          <Skeleton className="h-56 rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}

function MarketingStat({
  value,
  label,
  helper,
}: {
  value: string;
  label: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/70 p-5 text-center md:border-l md:first:border-l-0 md:first:pl-0">
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      {helper ? <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p> : null}
    </div>
  );
}

function TrackCard({ track }: { track: MarketingTrack }) {
  const meta = getTrackMeta(track);
  const Icon = meta.icon;

  return (
    <Card className="group flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:bg-[var(--bg-card-hover)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ${meta.accent}`}>
          <Icon size={20} />
        </div>
        <Badge variant={meta.badge}>{track.moduleCount ?? 0} modules</Badge>
      </div>

      <div className="space-y-2">
        <Badge className="w-fit">{formatTrackCategory(track.category)}</Badge>
        <h3 className="text-xl font-semibold leading-tight text-white">{track.title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{track.description}</p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Badge variant="purple">{track.xpReward ?? 0} XP</Badge>
        <Badge variant="success">Project-led</Badge>
        <Badge variant="warning">Mentor guided</Badge>
      </div>

      <Link
        to="/how-it-works"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:gap-3"
      >
        Explore pathway <ArrowRight size={16} />
      </Link>
    </Card>
  );
}

function MentorCard({ mentor }: { mentor: MarketingMentor }) {
  return (
    <Card className="flex h-full flex-col gap-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/35">
      <div className="relative mx-auto">
        <Avatar src={mentor.avatar} name={mentor.fullName} size="lg" className="ring-4 ring-primary/20" />
        <span className="absolute -right-2 -top-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-success">
          {mentor.mentorScore ?? 0}%
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{mentor.fullName}</h3>
        <p className="text-sm text-primary">{mentor.currentCompany || "Industry mentor"}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {mentor.totalSessions ?? 0} sessions delivered
        </p>
      </div>

      <div className="mt-auto space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--secondary))]"
            style={{ width: `${Math.min(100, mentor.mentorScore ?? 0)}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {(mentor.expertise ?? []).slice(0, 3).map((skill) => (
            <Badge key={skill} variant="purple">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function HomePage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["marketing", "home"],
    queryFn: fetchMarketingHome,
  });

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load the home page right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const stats = [
    {
      value: formatCompactCount(data?.stats.activeLearners ?? 0),
      label: "Active learners",
      helper: "Growing across the network",
    },
    {
      value: formatCompactCount(data?.stats.trackCount ?? 0),
      label: "Learning pathways",
      helper: "Core programs in the catalog",
    },
    {
      value: formatCompactCount(data?.stats.mentorNetwork ?? 0),
      label: "Mentor network",
      helper: "Guides from industry and academia",
    },
    {
      value: `${data?.hero.topMentorScore ?? 0}%`,
      label: "Top mentor score",
      helper: "Realtime quality signal",
    },
  ];

  return (
    <div>
      <motion.section
        className="page-shell grid gap-10 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="max-w-2xl">
          <Badge className="mb-5">Starting January 2026</Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Code the Future of <span className="glow-text">Ethiopia</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            An immersive virtual campus for software engineering, AI, and cyber defense -
            hands-on, gamified, and mentorship-driven from Grade 8 upward.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register?role=student">
              <Button size="lg">Get Learning</Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button variant="outline" size="lg">
                Become a Mentor
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
            {["Realtime classrooms", "Role-based access", "Project reviews"].map((item) => (
              <span key={item} className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.18),transparent_30%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(10,16,28,0.96),rgba(4,9,18,0.98))] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
            <div className="relative rounded-[24px] border border-white/5 bg-black/20 p-4">
              <div className="absolute right-4 top-4 max-w-[160px]">
                <Card className="border-primary/30 bg-[rgba(8,14,24,0.92)] p-3 shadow-lg shadow-primary/10 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    Live learners
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {formatCompactCount(data?.hero.activeLearners ?? 0)}
                  </p>
                  <p className="text-xs text-success">
                    {data?.hero.topMentorScore ?? 0}% mentor quality
                  </p>
                </Card>
              </div>

              <div className="absolute bottom-4 left-4 z-10">
                <Card className="max-w-[220px] border-secondary/30 bg-[rgba(8,14,24,0.92)] p-3 shadow-lg shadow-secondary/10 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Top mentor
                      </p>
                      <p className="text-sm font-semibold text-white">{data?.hero.topMentorName || "Mentor"}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <SmartImage
                unsplashId={MEDIA_CATEGORIES.marketing.hero[0].unsplashId}
                alt={MEDIA_CATEGORIES.marketing.hero[0].alt}
                hoverEffect="zoom"
                wrapperClassName="rounded-2xl border border-white/5 shadow-2xl overflow-hidden mt-6"
                className="mx-auto max-h-[420px] aspect-[16/10] w-full object-cover"
                width={800}
                quality={85}
              />
            </div>
          </div>
        </div>
      </motion.section>

      <section className="page-shell">
        <div className="surface-panel grid gap-4 p-4 md:grid-cols-4">
          {stats.map((stat) => (
            <MarketingStat key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <motion.section
        className="page-shell py-20"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">Learning pathways</Badge>
            <h2 className="section-title">Master the Tech of Tomorrow</h2>
            <p className="section-copy mt-4">
              Structured tracks from fundamentals to job-ready engineering skills, with the same
              visual weight and clarity across every device.
            </p>
          </div>
          <Link to="/how-it-works">
            <Button variant="outline">View the learning flow</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data?.featuredTracks?.length ? (
            data.featuredTracks.map((track) => <TrackCard key={track._id} track={track} />)
          ) : (
            <div className="md:col-span-3">
              <EmptyState
                title="Learning pathways are being prepared"
                description="The platform is live, but the learning catalog is still warming up."
                actionLabel="See how it works"
                onAction={() => navigate("/how-it-works")}
              />
            </div>
          )}
        </div>
      </motion.section>

      <motion.section
        className="page-shell pb-24"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4">Expert mentors</Badge>
            <h2 className="section-title text-2xl md:text-3xl">Learn from Global Industry Leaders</h2>
          </div>
          <Link to="/register?role=mentor">
            <Button variant="outline">View all mentors</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data?.featuredMentors?.length ? (
            data.featuredMentors.map((mentor) => <MentorCard key={mentor._id} mentor={mentor} />)
          ) : (
            <div className="md:col-span-3">
              <EmptyState
                title="Mentor spots are opening soon"
                description="Mentor recruitment is active, and featured leaders will appear here once available."
                actionLabel="Become a mentor"
                onAction={() => navigate("/mentor-recruitment")}
              />
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
