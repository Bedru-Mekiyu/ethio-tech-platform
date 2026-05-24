import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Compass,
  GraduationCap,
  Layers3,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
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
        <Skeleton className="mx-auto h-6 w-40 rounded-full" />
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
        <Skeleton className="aspect-[4/3] rounded-[28px]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full max-w-[28rem]" />
          <Skeleton className="h-5 w-full max-w-[34rem]" />
          <Skeleton className="h-5 w-full max-w-[30rem]" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 rounded-[20px]" />
            <Skeleton className="h-20 rounded-[20px]" />
            <Skeleton className="h-20 rounded-[20px]" />
          </div>
        </div>
      </div>

      <Skeleton className="mt-20 h-32 w-full rounded-[28px]" />

      <div className="mt-20 space-y-4">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto h-10 w-full max-w-[28rem]" />
        <Skeleton className="mx-auto h-5 w-full max-w-[34rem]" />
        <div className="mt-10 space-y-4">
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
        </div>
      </div>

      <Skeleton className="mt-20 h-56 rounded-[28px]" />
    </div>
  );
}

function MissionCard({
  icon: Icon,
  label,
  title,
  description,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  tone: "primary" | "purple";
}) {
  return (
    <Card className="h-full border-[var(--border)] bg-[var(--bg-card)]/95 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-secondary/10 text-secondary"
          }`}
        >
          <Icon size={20} />
        </div>
        <Badge variant={tone === "primary" ? "default" : "purple"}>{label}</Badge>
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
    </Card>
  );
}

function StatCard({
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 p-5 text-center">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p>
    </div>
  );
}

function TimelineItem({
  year,
  title,
  description,
}: {
  year: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative pb-10 last:pb-0">
      <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-[var(--bg-base)]">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
      </span>
      <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="purple">{year}</Badge>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </Card>
    </div>
  );
}

export function AboutPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
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

  const roadmap = data?.roadmap ?? [];
  const stats = [
    {
      icon: Users,
      value: formatCompactCount(data?.stats.activeLearners ?? 0),
      label: "Active learners",
      helper: "Learners currently supported by the network",
      tone: "primary" as const,
    },
    {
      icon: GraduationCap,
      value: formatCompactCount(data?.stats.mentorNetwork ?? 0),
      label: "Mentors",
      helper: "Professional guides active across the platform",
      tone: "purple" as const,
    },
    {
      icon: Layers3,
      value: formatCompactCount(data?.stats.trackCount ?? 0),
      label: "Live pathways",
      helper: "Programs available for current cohorts",
      tone: "success" as const,
    },
    {
      icon: ShieldCheck,
      value: `${data?.stats.approvalRate ?? 0}%`,
      label: "Approval rate",
      helper: "Project quality signal from reviewed submissions",
      tone: "warning" as const,
    },
  ];

  return (
    <div>
      <motion.section
        className="mx-auto max-w-7xl px-4 pb-14 pt-16 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-5">{data?.hero.eyebrow ?? "About EthioTech"}</Badge>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
            A national learning network for future builders
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Empowering the Next Generation of{" "}
            <span className="glow-text">Ethiopian Tech Leaders</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            {data?.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register?role=student">
              <Button size="lg">Join as Student</Button>
            </Link>
            <Link to="/register?role=mentor">
              <Button variant="outline" size="lg">
                Become a Mentor
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-[var(--text-secondary)]">
            {data?.hero.highlights.map((item) => (
              <span key={item} className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="px-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          <MissionCard
            icon={Target}
            label={data?.mission.title ?? "Mission"}
            title={data?.mission.title ?? "Our Mission"}
            description={data?.mission.description ?? ""}
            tone="primary"
          />
          <MissionCard
            icon={Compass}
            label={data?.vision.title ?? "Vision"}
            title={data?.vision.title ?? "Our Vision"}
            description={data?.vision.description ?? ""}
            tone="purple"
          />
        </div>
      </section>

      <motion.section
        className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:items-center"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.28 }}
      >
        <div className="relative">
          <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.16),transparent_32%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(10,16,28,0.96),rgba(4,9,18,0.98))] p-4 shadow-[0_24px_120px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />

            <div className="absolute right-4 top-4 z-10 max-w-[170px]">
              <Card className="border-primary/30 bg-[rgba(8,14,24,0.92)] p-3 shadow-lg shadow-primary/10 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Live network
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {data?.stats.compact.activeLearners ?? "0"}
                </p>
                <p className="text-xs text-success">Students learning now</p>
              </Card>
            </div>

            <div className="absolute bottom-4 left-4 z-10 max-w-[220px]">
              <Card className="border-secondary/30 bg-[rgba(8,14,24,0.92)] p-3 shadow-lg shadow-secondary/10 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Project quality
                    </p>
                    <p className="text-sm font-semibold text-white">{data?.stats.approvalRate ?? 0}%</p>
                  </div>
                </div>
              </Card>
            </div>

            <img
              src={heroImage}
              alt="EthioTech immersive learning environment preview"
              className="mx-auto max-h-[440px] w-full object-contain py-8 drop-shadow-[0_0_48px_rgba(123,97,255,0.25)]"
            />
          </div>
        </div>

        <div>
          <Badge variant="purple">{data?.bridge.eyebrow}</Badge>
          <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{data?.bridge.title}</h2>
          <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">{data?.bridge.description}</p>

          <div className="mt-8 space-y-3">
            {(data?.bridge.bullets ?? []).map((bullet, index) => {
              const icons = [Sparkles, ShieldCheck, MapPinned];
              const Icon = icons[index] ?? Sparkles;
              return (
                <Card
                  key={bullet}
                  className="flex items-start gap-4 border-[var(--border)] bg-[var(--bg-card)]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={18} />
                  </div>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{bullet}</p>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/how-it-works">
              <Button variant="outline">See the learning flow</Button>
            </Link>
            <Link to="/community">
              <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary">
                Explore the community
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="px-4 lg:px-8">
        <Card className="mx-auto grid max-w-7xl gap-4 rounded-[28px] border-primary/20 bg-[var(--bg-elevated)]/90 p-4 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </Card>
      </section>

      <motion.section
        className="mx-auto max-w-4xl px-4 py-20 lg:px-8"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="text-center">
          <Badge className="mb-4">Our roadmap</Badge>
          <h2 className="text-3xl font-bold md:text-4xl">A journey built in phases</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
            The platform has evolved from an idea into a scalable learning ecosystem, with each
            phase focused on clearer progression, stronger collaboration, and broader access.
          </p>
        </div>

        {roadmap.length ? (
          <div className="relative mt-12 ml-2 border-l border-primary/30 pl-8">
            {roadmap.map((item) => (
              <TimelineItem key={item.year} {...item} />
            ))}
          </div>
        ) : (
          <div className="mt-12">
            <EmptyState
              title="The roadmap is being prepared"
              description="We are still finalizing the public milestone view for this section."
              actionLabel="See how it works"
              onAction={() => {
                navigate("/how-it-works");
              }}
            />
          </div>
        )}
      </motion.section>

      <section className="px-4 pb-24 lg:px-8">
        <Card className="mx-auto max-w-7xl overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="mb-4">Join the movement</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{data?.cta.title}</h2>
              <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">{data?.cta.description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              <Link to={data?.cta.primary.to ?? "/register?role=student"}>
                <Button size="lg">{data?.cta.primary.label ?? "Join as Student"}</Button>
              </Link>
              <Link to={data?.cta.secondary.to ?? "/register?role=mentor"}>
                <Button variant="outline" size="lg">
                  {data?.cta.secondary.label ?? "Become a Mentor"}
                </Button>
              </Link>
              <Link to={data?.cta.tertiary.to ?? "/how-it-works"}>
                <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
                  {data?.cta.tertiary.label ?? "Explore the learning flow"}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
