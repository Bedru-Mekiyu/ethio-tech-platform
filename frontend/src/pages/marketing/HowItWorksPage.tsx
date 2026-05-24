import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Layers3,
  PlayCircle,
  Sparkles,
  Trophy,
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
import { fetchTracks, type TrackSummary } from "@/services/tracksService";

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

function HowItWorksSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-5">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-16 w-full max-w-[34rem]" />
          <Skeleton className="h-5 w-full max-w-[42rem]" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-40 rounded-xl" />
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] rounded-[28px]" />
      </div>
      <div className="mt-12 space-y-8">
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
      <Skeleton className="mt-16 h-56 rounded-[28px]" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  helper,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p>
    </Card>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex items-start gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
        <Icon size={18} />
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
    </Card>
  );
}

function JourneySection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Badge className="mb-4">{eyebrow}</Badge>
      <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function HowItWorksPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tracks", "how-it-works"],
    queryFn: fetchTracks,
  });

  if (isLoading) {
    return <HowItWorksSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load the learning journey right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const tracks = (Array.isArray(data) ? data : []) as TrackSummary[];
  if (!tracks.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <EmptyState
          title="Learning tracks are still being prepared"
          description="Once the curriculum is published, this journey view will populate automatically."
          actionLabel="Go back home"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  const featuredTracks = tracks.slice(0, 3);
  const totalModules = tracks.reduce((sum, track) => sum + (track.modules?.length ?? 0), 0);
  const totalLessons = tracks.reduce(
    (sum, track) => sum + (track.modules?.reduce((lessonSum, module) => lessonSum + (module.lessons?.length ?? 0), 0) ?? 0),
    0
  );
  const totalXp = tracks.reduce((sum, track) => sum + (track.xpReward ?? 0), 0);
  const strongestTrack = [...tracks].sort((a, b) => (b.xpReward ?? 0) - (a.xpReward ?? 0))[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <motion.section
        className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="max-w-2xl">
          <Badge className="mb-5">Learning journey</Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Your Journey to <span className="glow-text">Tech Mastery</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            Every track is structured to move learners from guided practice into real project delivery,
            with support, momentum, and recognition built into every step.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register?role=student">
              <Button size="lg">Start learning</Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button variant="outline" size="lg">
                Become a mentor
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
            {["Immersive learning", "Real projects", "Level-based progress"].map((item) => (
              <span key={item} className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-2">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={Layers3}
              value={formatCompactNumber(tracks.length)}
              label="Tracks"
              helper="Live learning pathways"
            />
            <StatCard
              icon={BookOpen}
              value={formatCompactNumber(totalModules)}
              label="Modules"
              helper="Structured knowledge blocks"
            />
            <StatCard
              icon={Sparkles}
              value={formatCompactNumber(totalXp)}
              label="XP"
              helper="Available across the catalog"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.15),transparent_34%)] blur-2xl" />
          <Card className="relative overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(15,22,36,0.98),rgba(5,10,19,0.98))] p-4">
            <div className="absolute left-4 top-4 z-10 rounded-full border border-primary/25 bg-[rgba(5,10,20,0.9)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary">
              Guided progression
            </div>
            <img
              src={heroImage}
              alt="EthioTech learning journey preview"
              className="h-full min-h-[320px] w-full rounded-[22px] object-cover"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Lessons</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(totalLessons)}</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Top track</p>
                <p className="mt-2 text-base font-semibold text-white">{strongestTrack?.title || "Pathway"}</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">XP available</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(totalXp)}</p>
              </Card>
            </div>
          </Card>
        </div>
      </motion.section>

      <motion.section
        className="mt-16 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="order-2 lg:order-1">
          <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(180deg,rgba(9,14,24,0.98),rgba(7,10,18,0.98))] p-4">
            <img
              src={heroImage}
              alt="Immersive learning preview"
              className="h-full min-h-[300px] w-full rounded-[20px] object-cover"
            />
          </Card>
        </div>
        <JourneySection
          eyebrow="01 · Immersive Learning"
          title="Every lesson has a clear next move."
          description="Students learn in guided sequences that keep the platform calm, focused, and easy to follow even on smaller devices."
        >
          <div className="grid gap-3">
            <FeaturePill
              icon={PlayCircle}
              title="Guided tracks"
              description="Each pathway is split into modules and lessons so learners always know where to continue."
            />
            <FeaturePill
              icon={Users}
              title="Mentor support"
              description="Live mentors and squad learning keep the experience collaborative instead of isolated."
            />
            <FeaturePill
              icon={Code2}
              title="Practice-first flow"
              description="Short practice loops and project checkpoints reduce friction and keep progress visible."
            />
          </div>
        </JourneySection>
      </motion.section>

      <motion.section
        className="mt-16 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <JourneySection
          eyebrow="02 · Build Real Projects"
          title="Progress should end in something concrete."
          description="The strongest part of the journey is not the lesson list — it is the portfolio of real work learners ship as they grow."
        >
          <div className="grid gap-3">
            <FeaturePill
              icon={Layers3}
              title="Portfolio outputs"
              description="Tracks culminate in projects that reflect practical skill, not just course completion."
            />
            <FeaturePill
              icon={Sparkles}
              title="Visible feedback"
              description="Mentor review and project approvals turn progress into something learners can see."
            />
            <FeaturePill
              icon={BookOpen}
              title="Structured curriculum"
              description={`${featuredTracks.length} featured pathways help balance breadth, depth, and pacing.`}
            />
          </div>
        </JourneySection>
        <div className="order-1 lg:order-2">
          <Card className="overflow-hidden border-secondary/20 bg-[linear-gradient(180deg,rgba(12,16,30,0.98),rgba(6,9,18,0.98))] p-4">
            <div className="relative overflow-hidden rounded-[22px]">
              <img
                src={heroImage}
                alt="Project building preview"
                className="h-full min-h-[300px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="border-primary/25 bg-[rgba(8,14,24,0.92)] p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Build real projects</p>
                  <p className="mt-1 text-lg font-semibold text-white">{strongestTrack?.title || "Project pathway"}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {strongestTrack?.description || "A path that moves from fundamentals to delivery."}
                  </p>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </motion.section>

      <motion.section
        className="mt-16 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="order-2 lg:order-1">
          <Card className="grid gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-5 sm:grid-cols-3">
            <Card className="border-primary/20 bg-primary/10 p-4">
              <Trophy className="text-primary" size={22} />
              <p className="mt-3 text-lg font-semibold text-white">Level up</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Progress stays visible at every step.</p>
            </Card>
            <Card className="border-secondary/20 bg-secondary/10 p-4">
              <Sparkles className="text-secondary" size={22} />
              <p className="mt-3 text-lg font-semibold text-white">Earn badges</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Recognition reinforces momentum.</p>
            </Card>
            <Card className="border-success/20 bg-success/10 p-4">
              <Users className="text-success" size={22} />
              <p className="mt-3 text-lg font-semibold text-white">Climb together</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Cohorts and mentors keep it social.</p>
            </Card>
          </Card>
        </div>
        <JourneySection
          eyebrow="03 · Level Up & Rank"
          title="Motivation should feel earned, not noisy."
          description="XP, badges, and leaderboard movement give learners a reason to come back without turning the platform into a distraction."
        >
          <div className="grid gap-3">
            <FeaturePill
              icon={Trophy}
              title="Clear progression"
              description="The platform rewards consistency with rank growth and visible achievement."
            />
            <FeaturePill
              icon={Sparkles}
              title="Positive feedback loops"
              description="Every completed lesson should produce a small moment of satisfaction."
            />
            <FeaturePill
              icon={Layers3}
              title="Learning at scale"
              description="The same structure works across tracks, roles, devices, and internet conditions."
            />
          </div>
        </JourneySection>
      </motion.section>

      <Card className="mt-16 overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge className="mb-4">Start now</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Start Your Gamified Journey Today</h2>
            <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">
              Once you pick a track, the platform keeps the next step obvious: continue learning, get mentor
              feedback, and level up with real progress.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <Link to="/register?role=student">
              <Button size="lg">Join a learning track</Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg">
                See learner growth
              </Button>
            </Link>
            <Link to="/mentor-recruitment">
              <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
                See mentorship options
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
