import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Building2, MapPin, MonitorSmartphone, ShieldCheck, Users, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/composites/EmptyState";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMarketingHubs, type MarketingHub, type MarketingHubsData } from "@/services/marketingService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const cityPositions: Record<string, { top: string; left: string }> = {
  "Addis Ababa": { top: "56%", left: "46%" },
  "Bahir Dar": { top: "28%", left: "36%" },
  Hawassa: { top: "76%", left: "54%" },
  Mekelle: { top: "18%", left: "62%" },
  "Dire Dawa": { top: "42%", left: "72%" },
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: value >= 1_000 ? 1 : 0,
  }).format(value);
}

function getLegendBadgeVariant(tone: MarketingHubsData["legend"][number]["tone"]) {
  if (tone === "primary") return "default";
  return tone;
}

function HubsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <Skeleton className="mx-auto h-6 w-44 rounded-full" />
        <Skeleton className="mx-auto mt-5 h-14 w-full max-w-4xl" />
        <Skeleton className="mx-auto mt-4 h-5 w-full max-w-3xl" />
      </div>
      <Skeleton className="mt-12 h-[460px] rounded-[28px]" />
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
      </div>
    </div>
  );
}

function HubCard({ hub }: { hub: MarketingHub }) {
  const available = hub.computersAvailable;
  const capacity = hub.capacity || 1;
  const availabilityRatio = Math.min(100, Math.round((available / capacity) * 100));

  return (
    <Card className="flex h-full flex-col gap-4 border-[var(--border)] bg-[var(--bg-card)]/95 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Badge variant={availabilityRatio >= 50 ? "success" : availabilityRatio >= 20 ? "warning" : "purple"}>
            {availabilityRatio >= 50
              ? "High availability"
              : availabilityRatio >= 20
                ? "Moderate availability"
                : "Limited seats"}
          </Badge>
          <h3 className="text-xl font-semibold text-white">{hub.city}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{hub.address}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-3">
          <MapPin className="text-primary" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Capacity</p>
          <p className="mt-2 text-2xl font-semibold text-white">{capacity}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Computers</p>
          <p className="mt-2 text-2xl font-semibold text-white">{available}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <span>Seat availability</span>
          <span>{availabilityRatio}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--secondary))]"
            style={{ width: `${availabilityRatio}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hub.mentorInCharge ? (
          <Badge variant="purple">
            <Users className="mr-1" size={12} />
            {hub.mentorInCharge.fullName}
          </Badge>
        ) : (
          <Badge variant="warning">Mentor pending</Badge>
        )}
        <Badge variant="success">{formatCompactNumber(hub.visits)} visits</Badge>
      </div>

      <Button className="mt-auto w-full" variant="outline">
        Book a visit
      </Button>
    </Card>
  );
}

function HubMarker({ hub, index }: { hub: MarketingHub; index: number }) {
  const fallbackCols = 5;
  const fallbackRow = Math.floor(index / fallbackCols);
  const fallbackCol = index % fallbackCols;
  const position = cityPositions[hub.city] ?? {
    top: `${20 + fallbackRow * 10 + (fallbackCol % 2) * 2}%`,
    left: `${22 + fallbackCol * 14 + (fallbackRow % 2) * 3}%`,
  };
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: position.top, left: position.left }}>
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full border border-primary/30 bg-[rgba(8,14,24,0.96)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-lg">
          {hub.city}
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-primary">
          <MapPin size={16} />
        </span>
      </div>
    </div>
  );
}

export function HubsPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<"all" | "high" | "limited">("all");
  const { data, isLoading, isError, error, refetch } = useQuery<MarketingHubsData>({
    queryKey: ["marketing", "hubs"],
    queryFn: fetchMarketingHubs,
  });

  const filteredHubs = useMemo(() => {
    const hubs = data?.hubs ?? [];
    if (filter === "high") {
      return hubs.filter((hub) => hub.computersAvailable / Math.max(1, hub.capacity) >= 0.5);
    }
    if (filter === "limited") {
      return hubs.filter((hub) => hub.computersAvailable / Math.max(1, hub.capacity) < 0.2);
    }
    return hubs;
  }, [data, filter]);

  if (isLoading) {
    return <HubsSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load hubs right now."}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (!data?.hubs.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <EmptyState
          title="No hubs available yet"
          description="Hub locations will appear here once they are set up."
          actionLabel="Contact the team"
          onAction={() => {
            navigate("/contact");
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
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">{data.hero.title}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
          {data.hero.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-[var(--text-secondary)]">
          {data.hero.highlights.map((item) => (
            <span key={item} className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-2">
              {item}
            </span>
          ))}
        </div>
      </motion.section>

      <section className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5 text-center">
          <Building2 className="mx-auto text-primary" size={18} />
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {formatCompactNumber(data.stats.hubCount)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Hubs</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Community learning locations</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5 text-center">
          <Wifi className="mx-auto text-secondary" size={18} />
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {formatCompactNumber(data.stats.availableSeats)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Open seats</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Ready for learners today</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5 text-center">
          <MonitorSmartphone className="mx-auto text-success" size={18} />
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {formatCompactNumber(data.stats.totalSeats)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Seats</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Across the full network</p>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--bg-card)]/85 p-5 text-center">
          <ShieldCheck className="mx-auto text-warning" size={18} />
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {formatCompactNumber(data.stats.activeMentors)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Mentor hubs</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Supported by local mentors</p>
        </Card>
      </section>

      <motion.section
        className="mt-16"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Hub locations</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.legend.map((item) => (
              <Badge key={item.label} variant={getLegendBadgeVariant(item.tone)}>
                {item.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="relative min-h-[460px] overflow-hidden rounded-[28px] border-white/[0.06] bg-[var(--bg-card)] p-4">
            <div className="relative h-[420px] rounded-[24px] border border-white/5 bg-[var(--bg-base)]">
              {filteredHubs.map((hub, index) => (
                <HubMarker key={hub._id} hub={hub} index={index} />
              ))}
            </div>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--bg-card)]/95 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="mt-3 text-2xl font-semibold text-white">Find the closest learning space</h3>
              </div>
              <div className="flex gap-2">
                {(["all", "high", "limited"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.22em] transition ${
                      filter === item
                        ? "border-primary bg-primary text-[var(--bg-base)]"
                        : "border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                    }`}
                  >
                    {item === "all" ? "All" : item === "high" ? "High availability" : "Limited"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredHubs.map((hub) => (
                <div
                  key={hub._id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{hub.city}</p>
                      <p className="text-xs text-[var(--text-muted)]">{hub.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{hub.computersAvailable} seats</p>
                    <p className="text-xs text-[var(--text-muted)]">{hub.visits} visits</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </motion.section>

      <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredHubs.map((hub) => (
          <HubCard key={hub._id} hub={hub} />
        ))}
      </section>

      <Card className="mt-16 overflow-hidden border-primary/20 bg-[linear-gradient(135deg,rgba(0,210,255,0.12),rgba(123,97,255,0.08))] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">{data.cta.title}</h2>
            <p className="mt-4 max-w-2xl text-[var(--text-secondary)]">{data.cta.description}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
            <Link to={data.cta.primary.to}>
              <Button size="lg">{data.cta.primary.label}</Button>
            </Link>
            <Link to={data.cta.secondary.to}>
              <Button variant="outline" size="lg">
                {data.cta.secondary.label}
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="ghost" size="lg" className="text-primary hover:bg-primary/10 hover:text-primary">
                Learn how hubs fit the journey
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
