import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  Layers3,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import heroImage from "@/assets/hero.png";
import { fetchTracks, type TrackSummary } from "@/services/tracksService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";

type JourneyStep = {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
};

const journeySteps: JourneyStep[] = [
  {
    icon: <BookOpen size={18} />,
    title: "Structured learning",
    description: "Each track is broken into modules and lessons so students always know what comes next.",
    tag: "Clear path",
  },
  {
    icon: <Video size={18} />,
    title: "Live mentor sessions",
    description: "Mentors host protected classrooms, office hours, and code reviews that keep progress human.",
    tag: "Realtime support",
  },
  {
    icon: <Layers3 size={18} />,
    title: "Build real projects",
    description: "Students ship portfolio work, get feedback, and turn learning into something visible.",
    tag: "Project driven",
  },
  {
    icon: <Trophy size={18} />,
    title: "Earn recognition",
    description: "XP, badges, and rank progression make effort visible without turning the platform into noise.",
    tag: "Motivation loop",
  },
];

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function getTrackAccent(track: TrackSummary) {
  const text = `${track.category ?? ""} ${track.title}`.toLowerCase();

  if (text.includes("ai") || text.includes("data")) {
    return { badge: "purple" as const, icon: Sparkles };
  }
  if (text.includes("cyber") || text.includes("security")) {
    return { badge: "warning" as const, icon: ShieldCheck };
  }
  if (text.includes("full") || text.includes("stack") || text.includes("web")) {
    return { badge: "default" as const, icon: Cpu };
  }
  return { badge: "success" as const, icon: CheckCircle2 };
}

function HowItWorksSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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
      <Skeleton className="mt-10 h-32 rounded-[28px]" />
      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-56 rounded-[24px]" />
        <Skeleton className="h-56 rounded-[24px]" />
        <Skeleton className="h-56 rounded-[24px]" />
        <Skeleton className="h-56 rounded-[24px]" />
      </div>
    </div>
  );
}

function TrackCard({ track, maxModules }: { track: TrackSummary; maxModules: number }) {
  const accent = getTrackAccent(track);
  const Icon = accent.icon;
  const moduleCount = track.modules?.length ?? 0;
  const lessonCount = track.modules?.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0) ?? 0;

  return (
    <Card className="group flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-[var(--bg-card-hover)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-primary">
          <Icon size={20} />
        </div>
        <Badge variant={accent.badge}>{formatCompactNumber(moduleCount)} modules</Badge>
      </div>

      <div className="space-y-2">
        <Badge className="w-fit">{track.category ?? "Program"}</Badge>
        <h3 className="text-xl font-semibold leading-tight text-white">{track.title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {track.description || "A structured path designed to move learners from fundamentals to delivery."}
        </p>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <span>Curriculum density</span>
          <span>{lessonCount} lessons</span>
        </div>
        <ProgressBar value={moduleCount} max={Math.max(maxModules, 1)} color="primary" />
        <div className="flex flex-wrap gap-2">
          <Badge variant="purple">{track.xpReward ?? 0} XP</Badge>
          <Badge variant="success">Mentor led</Badge>
        </div>
      </div>
    </Card>
  );
}

export function HowItWorksPage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tracks", "how-it-works"],
    queryFn: fetchTracks,
  });

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return <HowItWorksSkeleton />;
  }

  const tracks = (Array.isArray(data) ? data : []) as TrackSummary[];
  const featuredTracks = tracks.slice(0, 6);
  const totalModules = tracks.reduce((sum, track) => sum + (track.modules?.length ?? 0), 0);
  const totalLessons = tracks.reduce(
    (sum, track) =>
      sum + (track.modules?.reduce((lessonSum, module) => lessonSum + (module.lessons?.length ?? 0), 0) ?? 0),
    0
  );
  const totalXp = tracks.reduce((sum, track) => sum + (track.xpReward ?? 0), 0);
  const strongestTrack = [...tracks].sort((a, b) => (b.xpReward ?? 0) - (a.xpReward ?? 0))[0];
  const maxModules = Math.max(...tracks.map((track) => track.modules?.length ?? 0), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <motion.section
        className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="max-w-2xl">
          <Badge className="mb-5">Learning journey</Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            From first line of code to job-ready engineer.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            EthioTech turns theory into momentum: guided lessons, live mentor rooms, project delivery,
            and recognition that helps learners stay engaged on any device.
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

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
            {["Mobile friendly", "Protected classrooms", "Realtime collaboration"].map((item) => (
              <span key={item} className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-2">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Tracks</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(tracks.length)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Live learning paths</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Modules</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(totalModules)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Structured curriculum blocks</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Lessons</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(totalLessons)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Hands-on lesson units</p>
            </Card>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(123,97,255,0.15),transparent_34%)] blur-2xl" />
          <Card className="relative overflow-hidden rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(15,22,36,0.98),rgba(5,10,19,0.98))] p-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden rounded-[22px] border border-white/5 bg-black/20">
                <div className="absolute left-4 top-4 z-10 rounded-full border border-primary/25 bg-[rgba(5,10,20,0.9)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary">
                  Guided journey
                </div>
                <img
                  src={heroImage}
                  alt="Learning journey preview"
                  className="h-full min-h-[280px] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    What learners experience
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {strongestTrack?.title || "Structured learning tracks"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <Card className="border-primary/25 bg-[rgba(8,14,24,0.95)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <PlayCircle size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Step 1
                      </p>
                      <p className="font-semibold text-white">Start with guided lessons</p>
                    </div>
                  </div>
                </Card>
                <Card className="border-secondary/25 bg-[rgba(8,14,24,0.95)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Step 2
                      </p>
                      <p className="font-semibold text-white">Join mentor rooms and squads</p>
                    </div>
                  </div>
                </Card>
                <Card className="border-success/25 bg-[rgba(8,14,24,0.95)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/15 text-success">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Step 3
                      </p>
                      <p className="font-semibold text-white">Earn XP and unlock progress</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Modules</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(totalModules)}</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Lessons</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(totalLessons)}</p>
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
        className="mt-16"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4">How it helps you succeed</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">The platform is built around clarity, momentum, and support.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Students don’t need a confusing dashboard. They need a path that makes the next step obvious,
              keeps them accountable, and gives them proof of progress.
            </p>
          </div>
          <Link to="/leaderboard">
            <Button variant="outline">See the growth loop</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {journeySteps.map((step) => (
            <Card key={step.title} className="flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-primary">
                  {step.icon}
                </div>
                <Badge variant="purple">{step.tag}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
            </Card>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="mt-16"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4">23 subjects & disciplines</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Explore the learning ecosystem.</h2>
            <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">
              These tracks are not isolated pages — they are the backbone of a scalable curriculum that
              stays consistent across students, mentors, and hubs.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/app/tracks")}>
            Browse all tracks
          </Button>
        </div>

        {featuredTracks.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredTracks.map((track) => (
              <TrackCard key={track._id} track={track} maxModules={maxModules} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="No learning tracks are available yet"
              description="Once track content is published, the curriculum grid will populate here automatically."
              actionLabel="Go back to home"
              onAction={() => navigate("/")}
            />
          </div>
        )}
      </motion.section>

      <Card className="mt-16 grid gap-4 rounded-[28px] border-primary/20 bg-[linear-gradient(180deg,rgba(16,23,37,0.95),rgba(8,12,20,0.98))] p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <Badge variant="success">Where students grow in one place</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-white">Built for mentorship, not just course completion.</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            The structure combines live support, project-based learning, and measurable progression so the
            experience feels educational, collaborative, and genuinely motivating.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/register?role=student">
            <Button size="lg">Start as a student</Button>
          </Link>
          <Link to="/mentor-recruitment">
            <Button variant="outline" size="lg">
              Support as a mentor
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
