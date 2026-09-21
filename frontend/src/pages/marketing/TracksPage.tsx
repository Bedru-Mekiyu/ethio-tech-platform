import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  BookOpen,
  ArrowRight,
  Clock,
  GraduationCap,
  Video,
  Award,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
  Code2,
  Filter,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/composites/EmptyState";
import { CapstonePreviewModal } from "@/components/composites/CapstonePreviewModal";
import { TRACKS_CATALOG, type CapstoneProject } from "@/data/tracksCatalog";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "web" | "mobile" | "cloud" | "ai" | "cyber" | "design";
type DifficultyFilter = "all" | "Beginner" | "Intermediate" | "Advanced";

const CATEGORIES: Array<{ key: CategoryFilter; label: string }> = [
  { key: "all", label: "All Pathways" },
  { key: "web", label: "Fullstack Web" },
  { key: "mobile", label: "Mobile Dev" },
  { key: "cloud", label: "Cloud & DevOps" },
  { key: "ai", label: "Data Science & AI" },
  { key: "cyber", label: "Cyber Security" },
  { key: "design", label: "UI/UX & Systems" },
];

export function TracksPage() {
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>("all");
  const [expandedSyllabusId, setExpandedSyllabusId] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<{
    project: CapstoneProject;
    trackTitle: string;
    trackId: string;
  } | null>(null);

  const filteredTracks = useMemo(() => {
    return TRACKS_CATALOG.filter((track) => {
      // Category match
      if (selectedCategory !== "all" && track.categoryKey !== selectedCategory) {
        return false;
      }
      // Difficulty match
      if (selectedDifficulty !== "all" && track.difficulty !== selectedDifficulty) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = track.title.toLowerCase().includes(q);
        const inShortTitle = track.shortTitle.toLowerCase().includes(q);
        const inDescription = track.description.toLowerCase().includes(q);
        const inTooling = track.tooling.some((t) => t.name.toLowerCase().includes(q));
        const inCapstones = track.capstones.some(
          (c) => c.title.toLowerCase().includes(q) || c.techStack.some((s) => s.toLowerCase().includes(q)),
        );
        const inRoles = track.targetCareerRoles.some((r) => r.role.toLowerCase().includes(q));
        return inTitle || inShortTitle || inDescription || inTooling || inCapstones || inRoles;
      }
      return true;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const totalCapstones = useMemo(() => TRACKS_CATALOG.reduce((acc, t) => acc + t.capstones.length, 0), []);
  const totalLiveHours = useMemo(
    () => TRACKS_CATALOG.reduce((acc, t) => acc + t.liveSessionsCount + t.mentorshipHours, 0),
    [],
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Capstone Preview Modal */}
      <CapstonePreviewModal
        project={previewProject?.project ?? null}
        trackTitle={previewProject?.trackTitle}
        trackId={previewProject?.trackId}
        isOpen={Boolean(previewProject)}
        onClose={() => setPreviewProject(null)}
        isAppView={false}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-zinc-50/70 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-5">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-xs"
            >
              <Code2 size={13} className="text-zinc-700" />
              Industry-Standard Technical Curriculum
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight"
            >
              Master In-Demand Tech with <br className="hidden sm:inline" />
              <span className="text-[#b91c1c]">Production Capstones</span> & Mentorship
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto max-w-2xl text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal"
            >
              Forget static video tutorials. Build distributed cloud systems, real-time mobile apps, fraud detection
              engines, and hardened cybersecurity architectures with live code reviews.
            </motion.p>

            {/* Quick Metrics Bar */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4"
            >
              <Card className="border-zinc-200 bg-white p-3 text-center shadow-xs">
                <p className="text-xl font-bold text-zinc-900">6</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Core Tracks</p>
              </Card>
              <Card className="border-zinc-200 bg-white p-3 text-center shadow-xs">
                <p className="text-xl font-bold text-zinc-900">{totalCapstones}+</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Real Capstones
                </p>
              </Card>
              <Card className="border-zinc-200 bg-white p-3 text-center shadow-xs">
                <p className="text-xl font-bold text-zinc-900">{totalLiveHours}+</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Live & Mentor Hrs
                </p>
              </Card>
              <Card className="border-zinc-200 bg-white p-3 text-center shadow-xs">
                <p className="text-xl font-bold text-zinc-900">100%</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Free for Learners
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-8">
        {/* Filters and Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search tracks, tooling, capstone projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-zinc-300 text-xs rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -tranzinc-y-1/2 text-xs text-zinc-400 hover:text-zinc-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1">
                <Filter size={12} />
                Level:
              </span>
              {(["all", "Beginner", "Intermediate", "Advanced"] as DifficultyFilter[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition",
                    selectedDifficulty === diff
                      ? "border border-zinc-900 bg-zinc-900 text-white shadow-xs"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900",
                  )}
                >
                  {diff === "all" ? "All Levels" : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-200">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition",
                  selectedCategory === cat.key
                    ? "border border-zinc-900 bg-zinc-900 text-white shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks List */}
        {filteredTracks.length > 0 ? (
          <div className="grid gap-6">
            {filteredTracks.map((track) => {
              const isSyllabusExpanded = expandedSyllabusId === track.id;

              return (
                <Card
                  key={track.id}
                  id={track.id}
                  className="group relative overflow-hidden rounded-xl border-zinc-200 bg-white p-6 md:p-8 transition duration-150 hover:border-zinc-300 shadow-xs hover:shadow-sm"
                >
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Left Column: Track Info, Badges, Capstones, Career Roles */}
                    <div className="space-y-5">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" size="sm">
                          {track.category}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {track.difficulty}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {track.marketDemand.rating} Demand
                        </Badge>
                      </div>

                      {/* Header */}
                      <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">{track.title}</h2>
                        <p className="text-xs md:text-sm leading-relaxed text-zinc-600">{track.tagline}</p>
                      </div>

                      {/* Key stats bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                            <Clock size={11} className="text-zinc-700" />
                            Duration
                          </p>
                          <p className="mt-0.5 font-bold text-zinc-900 text-xs">{track.estimatedWeeks} Weeks</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                            <Video size={11} className="text-zinc-700" />
                            Live Sessions
                          </p>
                          <p className="mt-0.5 font-bold text-zinc-900 text-xs">{track.liveSessionsCount} Workshops</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                            <GraduationCap size={11} className="text-zinc-700" />
                            1:1 Mentorship
                          </p>
                          <p className="mt-0.5 font-bold text-zinc-900 text-xs">{track.mentorshipHours} Hours</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                            <Award size={11} className="text-amber-600" />
                            XP Reward
                          </p>
                          <p className="mt-0.5 font-bold text-zinc-900 text-xs">+{track.xpReward} XP</p>
                        </div>
                      </div>

                      {/* Practical Capstones Showcase */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                            <Code2 size={13} className="text-[#b91c1c]" />
                            Practical Capstone Projects
                          </h3>
                          <span className="text-[10px] text-zinc-500">Click to preview code & architecture</span>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {track.capstones.map((capstone) => (
                            <button
                              key={capstone.id}
                              type="button"
                              onClick={() =>
                                setPreviewProject({
                                  project: capstone,
                                  trackTitle: track.title,
                                  trackId: track.id,
                                })
                              }
                              className="group/cap text-left rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300 hover:bg-zinc-100/60"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="default" size="sm">
                                  {capstone.difficulty}
                                </Badge>
                                <span className="text-[10px] text-zinc-700 font-medium flex items-center gap-1">
                                  View Code <ArrowRight size={11} />
                                </span>
                              </div>
                              <h4 className="mt-1.5 text-xs font-semibold text-zinc-900 group-hover/cap:text-[#b91c1c] transition line-clamp-1">
                                {capstone.title}
                              </h4>
                              <p className="mt-0.5 text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                                {capstone.tagline}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {capstone.techStack.slice(0, 3).map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[9px] text-zinc-600 shadow-2xs"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {capstone.techStack.length > 3 && (
                                  <span className="rounded bg-white border border-zinc-200 px-1 py-0.5 text-[9px] text-zinc-500">
                                    +{capstone.techStack.length - 3}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tooling & Technologies */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                          <Cpu size={12} />
                          Core Tooling & Technologies
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {track.tooling.map((tool) => (
                            <span
                              key={tool.name}
                              className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700"
                            >
                              {tool.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Visual, Career Outcomes, Prerequisites, CTAs */}
                    <div className="flex flex-col justify-between gap-4">
                      {/* Image Preview & Market Demand Card */}
                      <div className="relative overflow-hidden rounded-xl border border-zinc-200 aspect-[16/10] sm:aspect-[2/1] lg:aspect-[16/10]">
                        <SmartImage
                          unsplashId={track.unsplashId}
                          alt={track.title}
                          wrapperClassName="h-full w-full border-none bg-transparent"
                          className="h-full w-full object-cover"
                          width={800}
                          quality={80}
                          hoverEffect="zoom"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent p-4 flex flex-col justify-end">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            Market Insight
                          </p>
                          <p className="text-xs font-semibold text-white mt-0.5">{track.marketDemand.growthMetric}</p>
                          <p className="text-[11px] text-zinc-300 mt-0.5">
                            Est. Compensation: {track.marketDemand.salaryRange}
                          </p>
                        </div>
                      </div>

                      {/* Career Outcomes Preview */}
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-zinc-700" />
                          Target Career Outcomes
                        </p>
                        <div className="space-y-1.5">
                          {track.targetCareerRoles.map((role) => (
                            <div key={role.role} className="flex items-start justify-between gap-2 text-xs">
                              <span className="font-medium text-zinc-800">{role.role}</span>
                              <span className="text-zinc-500 text-[11px] font-mono">{role.averageSalary}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prerequisites snippet */}
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-zinc-700" />
                          Skill Prerequisites
                        </p>
                        <ul className="space-y-1">
                          {track.prerequisites.map((req) => (
                            <li key={req.skill} className="text-xs text-zinc-600 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-800 shrink-0" />
                              <span className="font-medium text-zinc-800">{req.skill}</span>
                              <span className="text-[10px] text-zinc-500">({req.level})</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedSyllabusId(isSyllabusExpanded ? null : track.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 shadow-2xs"
                        >
                          <BookOpen size={14} />
                          <span>{isSyllabusExpanded ? "Hide Syllabus" : "View Full Syllabus"}</span>
                          {isSyllabusExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <Link to="/register" className="flex-1">
                          <Button className="w-full font-medium" size="md">
                            Enroll in This Track
                            <ArrowRight size={14} className="ml-1.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Syllabus Section */}
                  {isSyllabusExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6 border-t border-zinc-200 pt-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-zinc-900">Full Modular Curriculum & Lessons</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {track.modules.length} modules • Complete hands-on lesson breakdown
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {track.modules.map((module, mIdx) => (
                          <div
                            key={module._id}
                            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                                  Module {mIdx + 1}
                                </span>
                                <h4 className="text-xs font-semibold text-zinc-900 mt-0.5">{module.title}</h4>
                              </div>
                              <Badge variant="outline" size="sm">
                                {module.lessons.length} lessons
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-600 leading-relaxed">{module.description}</p>
                            <div className="space-y-1 pt-1.5 border-t border-zinc-200">
                              {module.lessons.map((lesson, lIdx) => (
                                <div
                                  key={lesson._id}
                                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md bg-white border border-zinc-200 shadow-2xs"
                                >
                                  <span className="text-zinc-800 truncate font-medium">
                                    {mIdx + 1}.{lIdx + 1} {lesson.title}
                                  </span>
                                  <span className="text-[10px] text-[#b91c1c] font-medium shrink-0 ml-2 font-mono">
                                    +{lesson.xpReward} XP ({lesson.durationMinutes}m)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No tracks matched your criteria"
            description="Try changing the category filter or searching for a different keyword like 'React', 'Docker', or 'Python'."
            actionLabel="Reset all filters"
            onAction={() => {
              setSelectedCategory("all");
              setSelectedDifficulty("all");
              setSearchQuery("");
            }}
          />
        )}
      </section>

      {/* Curriculum Pillars Callout */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Why EthioTech Tracks Are Built Differently
            </h2>
            <p className="text-xs md:text-sm text-zinc-600">
              Designed from the ground up for software engineering excellence, remote job readiness, and African
              innovation.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border-zinc-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                <Code2 size={18} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">Production-Grade Capstones</h3>
              <p className="text-xs leading-relaxed text-zinc-600">
                No trivial to-do apps. You will build multi-vendor e-commerce gateways, telemetry dashboards, and ML
                fraud scoring engines.
              </p>
            </Card>

            <Card className="border-zinc-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                <Video size={18} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">Live Socratic Mentorship</h3>
              <p className="text-xs leading-relaxed text-zinc-600">
                Weekly live code breakdowns with experienced engineers working across high-growth startups and tech
                teams.
              </p>
            </Card>

            <Card className="border-zinc-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                <Award size={18} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">Verified Skill Credentials</h3>
              <p className="text-xs leading-relaxed text-zinc-600">
                Earn cryptographically verifiable track completion certificates and build an undeniable public GitHub
                portfolio.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="relative overflow-hidden border-t border-zinc-200 bg-white py-14 text-center">
        <div className="mx-auto max-w-2xl px-4 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">
            <CheckCircle2 size={12} className="text-zinc-700" />
            <span>100% Tuition-Free Open Education Model</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Ready to Begin Your Technical Journey?
          </h2>
          <p className="text-xs md:text-sm text-zinc-600 leading-relaxed">
            Join hundreds of Ethiopian students and developers learning together, building real projects, and advancing
            their careers.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/register">
              <Button size="md" className="font-medium">
                Enroll in a Track (Free)
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="md" variant="outline">
                How It Works
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-3 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-zinc-700" /> No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-zinc-700" /> 6 Physical regional hubs
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-zinc-700" /> Verifiable on-chain certs
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
