import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Video,
  Award,
  Cpu,
  TrendingUp,
  Users,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { TRACKS_CATALOG } from "@/data/tracksCatalog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

export function MarketingTrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();

  const track = useMemo(
    () => TRACKS_CATALOG.find((t) => t.id === trackId || t.slug === trackId),
    [trackId],
  );

  usePageTitle(track ? `${track.shortTitle} — EthioTech` : "Track Not Found — EthioTech");

  // Redirect to tracks list if track not found
  if (!track) {
    return <Navigate to="/tracks" replace />;
  }

  const difficultyColors: Record<string, string> = {
    Beginner: "text-emerald-700 bg-emerald-50 border-emerald-200",
    Intermediate: "text-amber-700 bg-amber-50 border-amber-200",
    Advanced: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="page-shell py-10 sm:py-14 space-y-12">
      {/* ── Back Navigation ── */}
      <div>
        <Link
          to="/tracks"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={15} />
          All Curriculum Tracks
        </Link>
      </div>

      {/* ── Hero Header ── */}
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={track.badgeColor} size="sm">
              {track.category}
            </Badge>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                difficultyColors[track.difficulty] ?? "text-zinc-700 bg-zinc-100 border-zinc-200",
              )}
            >
              {track.difficulty}
            </span>
            {track.featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                <Star size={10} className="fill-amber-400 text-amber-500" />
                Featured Track
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              {track.title}
            </h1>
            <p className="mt-3 text-lg text-zinc-600 leading-relaxed max-w-2xl">{track.tagline}</p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-zinc-600">
              <Clock size={15} className="text-zinc-400" />
              <span className="font-medium text-zinc-900">{track.estimatedWeeks} weeks</span>
            </span>
            <span className="flex items-center gap-2 text-zinc-600">
              <Video size={15} className="text-zinc-400" />
              <span className="font-medium text-zinc-900">{track.liveSessionsCount} live sessions</span>
            </span>
            <span className="flex items-center gap-2 text-zinc-600">
              <GraduationCap size={15} className="text-zinc-400" />
              <span className="font-medium text-zinc-900">{track.mentorshipHours}h mentorship</span>
            </span>
            <span className="flex items-center gap-2 text-zinc-600">
              <Award size={15} className="text-zinc-400" />
              <span className="font-medium text-zinc-900">{track.xpReward.toLocaleString()} XP</span>
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/register">
              <Button className="gap-2 font-medium px-6">
                Enroll in Track
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/tracks">
              <Button variant="outline" className="gap-2 font-medium border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                Browse All Tracks
              </Button>
            </Link>
          </div>
        </div>

        {/* Track Image */}
        {(track.localImage || track.unsplashId) && (
          <div className="hidden lg:block">
            <SmartImage
              src={
                track.localImage ??
                `https://images.unsplash.com/${track.unsplashId}?fm=webp&fit=crop&w=800&q=80`
              }
              alt={`${track.title} — EthioTech curriculum track`}
              className="h-72 w-full rounded-2xl object-cover border border-zinc-200 shadow-sm"
              aspectRatio="aspect-[4/3]"
            />
          </div>
        )}
      </div>

      {/* ── Description ── */}
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">About This Track</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">{track.description}</p>
      </div>

      {/* ── Market Demand ── */}
      <Card className="border-zinc-200 bg-zinc-50/50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white flex-shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Market Demand</h3>
              <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-900">
                {track.marketDemand.rating}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">{track.marketDemand.summary}</p>
            <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
              <span>
                <span className="font-semibold text-zinc-900">Growth:</span>{" "}
                {track.marketDemand.growthMetric}
              </span>
              <span>
                <span className="font-semibold text-zinc-900">Salary Range:</span>{" "}
                {track.marketDemand.salaryRange}
              </span>
            </div>
            {track.marketDemand.topHiringSectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {track.marketDemand.topHiringSectors.map((sector) => (
                  <span
                    key={sector}
                    className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Curriculum Modules ── */}
      {track.modules.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen size={18} className="text-zinc-900" />
            <h2 className="text-lg font-semibold text-zinc-900">Curriculum Modules</h2>
            <Badge variant="outline" size="sm">
              {track.modules.length} modules
            </Badge>
          </div>
          <div className="space-y-3">
            {track.modules.map((module, index) => (
              <Card
                key={module._id}
                className="border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-600 flex-shrink-0">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900">{module.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{module.description}</p>
                    {module.lessons.length > 0 && (
                      <p className="text-[11px] text-zinc-400 mt-1.5">
                        {module.lessons.length} lessons ·{" "}
                        {Math.round(
                          module.lessons.reduce((sum, l) => sum + l.durationMinutes, 0) / 60,
                        )}h total
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Tooling & Tech Stack ── */}
      {track.tooling.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Cpu size={18} className="text-zinc-900" />
            <h2 className="text-lg font-semibold text-zinc-900">Tools & Technologies</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {track.tooling.map((tool) => (
              <span
                key={tool.name}
                className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
              >
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Career Outcomes ── */}
      {track.targetCareerRoles.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Users size={18} className="text-zinc-900" />
            <h2 className="text-lg font-semibold text-zinc-900">Career Outcomes</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {track.targetCareerRoles.map((role) => (
              <Card
                key={role.role}
                className="border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900 leading-snug">{role.role}</h3>
                    <span
                      className={cn(
                        "flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        role.type === "Primary Role"
                          ? "border-zinc-300 bg-zinc-100 text-zinc-700"
                          : "border-zinc-200 bg-white text-zinc-500",
                      )}
                    >
                      {role.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{role.description}</p>
                  <p className="text-xs font-medium text-zinc-900">{role.averageSalary}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Prerequisites ── */}
      {track.prerequisites.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={18} className="text-zinc-900" />
            <h2 className="text-lg font-semibold text-zinc-900">Prerequisites</h2>
          </div>
          <div className="space-y-2">
            {track.prerequisites.map((prereq) => (
              <div
                key={prereq.skill}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3"
              >
                <span
                  className={cn(
                    "flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium mt-0.5",
                    prereq.level === "Required"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : prereq.level === "Recommended"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600",
                  )}
                >
                  {prereq.level}
                </span>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{prereq.skill}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{prereq.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Final CTA ── */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Ready to start your journey?</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Join thousands of Ethiopian and East African students building their careers in technology.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/register">
            <Button className="gap-2 font-medium px-8">
              Enroll in {track.shortTitle}
              <ArrowRight size={15} />
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-50">
              How It Works
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
