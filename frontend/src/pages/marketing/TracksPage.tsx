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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
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
    <div className="min-h-screen bg-white text-slate-900">
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
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-5">
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 leading-[1.15]"
            >
              Master Production Engineering with <br className="hidden sm:inline" />
              <span className="text-primary">Experienced Mentors</span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
            >
              Build distributed systems, mobile apps, and cloud architectures with live weekly code reviews from
              experienced engineers.
            </motion.p>

            {/* Quick Metrics Bar */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-8 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-2 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/10 sm:grid-cols-4 text-center">
                <div className="pt-2 sm:pt-0">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">6</p>
                  <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Engineering Tracks</p>
                </div>
                <div className="pt-3 sm:pt-0 sm:pl-4">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {totalCapstones}+
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Audited Capstones</p>
                </div>
                <div className="pt-3 sm:pt-0 sm:pl-4">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {totalLiveHours}+
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Mentorship Hours</p>
                </div>
                <div className="pt-3 sm:pt-0 sm:pl-4">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">100%</p>
                  <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Tuition-Free</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16 lg:px-8 space-y-8">
        {/* Filters and Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search tracks, tooling, capstone projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200 text-xs rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-slate-400 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                <Filter size={12} />
                Level:
              </span>
              {(["all", "Beginner", "Intermediate", "Advanced"] as DifficultyFilter[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    selectedDifficulty === diff
                      ? "border border-slate-900 bg-slate-900 text-white shadow-xs font-semibold"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs",
                  )}
                >
                  {diff === "all" ? "All Levels" : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  selectedCategory === cat.key
                    ? "border border-slate-900 bg-slate-900 text-white shadow-xs font-semibold"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs",
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
                  className="group relative overflow-hidden rounded-2xl border-slate-200/80 bg-white p-6 md:p-8 transition-all duration-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                >
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Left Column: Track Info, Badges, Capstones, Career Roles */}
                    <div className="space-y-5">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          {track.category}
                        </Badge>
                        <Badge variant="outline" size="sm" className="border-slate-200 text-slate-700 font-medium">
                          {track.difficulty}
                        </Badge>
                        <Badge variant="outline" size="sm" className="border-slate-200 text-slate-700 font-medium">
                          {track.marketDemand.rating} Demand
                        </Badge>
                      </div>

                      {/* Header */}
                      <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight break-words">
                          <Link to={`/tracks/${track.slug}`} className="hover:text-primary transition-colors">
                            {track.title}
                          </Link>
                        </h2>
                        <p className="text-xs md:text-sm leading-relaxed text-slate-600">{track.tagline}</p>
                      </div>

                      {/* Key stats bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 text-center">
                        <div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                            <Clock size={11} className="text-slate-500" />
                            Duration
                          </p>
                          <p className="mt-0.5 font-bold text-slate-900 dark:text-white text-xs">
                            {track.estimatedWeeks} Weeks
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                            <Video size={11} className="text-slate-500" />
                            Live Sessions
                          </p>
                          <p className="mt-0.5 font-bold text-slate-900 dark:text-white text-xs">
                            {track.liveSessionsCount} Workshops
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                            <GraduationCap size={11} className="text-slate-500" />
                            1:1 Mentorship
                          </p>
                          <p className="mt-0.5 font-bold text-slate-900 dark:text-white text-xs">
                            {track.mentorshipHours} Hours
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                            <Award size={11} className="text-[var(--secondary)]" />
                            XP Reward
                          </p>
                          <p className="mt-0.5 font-bold text-slate-900 dark:text-white text-xs">
                            +{track.xpReward} XP
                          </p>
                        </div>
                      </div>

                      {/* Practical Capstones Showcase */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Code2 size={13} className="text-[var(--secondary)]" />
                            Capstone Projects
                          </h3>
                          <span className="text-[11px] text-slate-500">Preview code and architecture</span>
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
                              className="group/cap text-left rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-200 text-slate-700 font-medium"
                                >
                                  {capstone.difficulty}
                                </Badge>
                                <span className="text-[10px] text-slate-700 font-medium flex items-center gap-1">
                                  Preview Code <ArrowRight size={11} />
                                </span>
                              </div>
                              <h4 className="mt-1.5 text-xs font-semibold text-slate-900 group-hover/cap:text-primary transition line-clamp-1">
                                {capstone.title}
                              </h4>
                              <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {capstone.tagline}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {capstone.techStack.slice(0, 3).map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-600 shadow-2xs font-medium"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {capstone.techStack.length > 3 && (
                                  <span className="rounded bg-white border border-slate-200 px-1 py-0.5 text-[9px] text-slate-500 font-medium">
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
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Cpu size={12} />
                          Core Tooling & Technologies
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {track.tooling.map((tool) => (
                            <span
                              key={tool.name}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 font-medium"
                            >
                              {tool.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Visual, Career Outcomes, Prerequisites, CTAs */}
                    <div className="flex flex-col justify-between gap-4">
                      {/* Track Visual Preview */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200/90 shadow-xs">
                        <SmartImage
                          src={track.localImage}
                          unsplashId={track.unsplashId}
                          alt={`${track.title} engineering curriculum preview`}
                          hoverEffect="zoom"
                          className="h-full w-full object-cover"
                          wrapperClassName="h-full w-full border-none bg-transparent"
                          width={800}
                          quality={80}
                        />
                      </div>

                      {/* Market Insight & Industry Demand Card */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-4">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--secondary)]" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                              Market Demand & Compensation
                            </span>
                          </div>
                          <Badge variant="secondary" size="sm">
                            {track.marketDemand.rating} Demand
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                              Hiring Trajectory
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">{track.marketDemand.growthMetric}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                              Est. Compensation
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-900">{track.marketDemand.salaryRange}</p>
                          </div>
                        </div>
                      </div>

                      {/* Career Outcomes Preview */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-slate-700" />
                          Target Career Outcomes
                        </p>
                        <div className="space-y-1.5">
                          {track.targetCareerRoles.map((role) => (
                            <div key={role.role} className="flex items-start justify-between gap-2 text-xs">
                              <span className="font-medium text-slate-800">{role.role}</span>
                              <span className="text-slate-500 text-[11px] font-mono">{role.averageSalary}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prerequisites snippet */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-[var(--secondary)]" />
                          Skill Prerequisites
                        </p>
                        <ul className="space-y-1">
                          {track.prerequisites.map((req) => (
                            <li key={req.skill} className="text-xs text-slate-600 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-800 shrink-0" />
                              <span className="font-medium text-slate-800">{req.skill}</span>
                              <span className="text-[10px] text-slate-500">({req.level})</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Link
                          to={`/tracks/${track.slug}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 shadow-xs"
                        >
                          <span>View Track</span>
                          <ArrowRight size={13} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setExpandedSyllabusId(isSyllabusExpanded ? null : track.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 shadow-xs"
                        >
                          <BookOpen size={14} />
                          <span>{isSyllabusExpanded ? "Hide Syllabus" : "Syllabus"}</span>
                          {isSyllabusExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <Link to="/register" className="flex-1">
                          <Button className="w-full font-semibold shadow-xs" size="md">
                            Enroll Now
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
                      className="mt-6 border-t border-slate-200/80 pt-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Full Modular Curriculum & Lessons</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {track.modules.length} modules • Complete hands-on lesson breakdown
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {track.modules.map((module, mIdx) => (
                          <div
                            key={module._id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                  Module {mIdx + 1}
                                </span>
                                <h4 className="text-xs font-semibold text-slate-900 mt-0.5">{module.title}</h4>
                              </div>
                              <Badge
                                variant="outline"
                                size="sm"
                                className="border-slate-200 text-slate-700 font-medium"
                              >
                                {module.lessons.length} lessons
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{module.description}</p>
                            <div className="space-y-1 pt-1.5 border-t border-slate-200/80">
                              {module.lessons.map((lesson, lIdx) => (
                                <div
                                  key={lesson._id}
                                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs"
                                >
                                  <span className="text-slate-800 truncate font-medium">
                                    {mIdx + 1}.{lIdx + 1} {lesson.title}
                                  </span>
                                  <span className="text-xs text-[var(--secondary)] font-semibold shrink-0 ml-2 font-mono">
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
            title="No tracks found"
            description="Try changing filters or searching for keywords like React, Docker, or Python."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory("all");
              setSelectedDifficulty("all");
              setSearchQuery("");
            }}
          />
        )}
      </section>

      {/* Curriculum Pillars Callout */}
      <section className="border-t border-slate-200/80 bg-slate-50/60 dark:bg-slate-900/50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl break-words">
              Why Our Tracks Excel
            </h2>
            <p className="text-xs md:text-sm text-slate-600">
              Built for production engineering standards, remote employability, and Ethiopian infrastructure realities.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 space-y-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                <Code2 size={18} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Production Capstones</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Build distributed gateways, telemetry dashboards, and ML scoring systems with production test suites.
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 space-y-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                <Video size={18} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Engineering Mentorship</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Weekly live code breakdowns with experienced staff engineers and technical leads.
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 space-y-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[var(--secondary)] border border-blue-100 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300">
                <Award size={18} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Audited Certificates</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Earn cryptographically signed credentials linked directly to your audited GitHub repositories.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="relative overflow-hidden border-t border-slate-200/80 bg-white py-12 lg:py-16 text-center">
        <div className="mx-auto max-w-2xl px-4 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
            Start Your Engineering Pathway
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Join thousands of Ethiopian students mastering production software engineering with live mentorship and
            regional hubs.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
            <Link to="/register">
              <Button size="md" className="font-semibold shadow-xs">
                Enroll Free
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="md" variant="secondary" className="font-semibold shadow-xs">
                View Workflow
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[var(--secondary)]" /> Tuition-free access
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[var(--secondary)]" /> Six regional hubs
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[var(--secondary)]" /> Audited credentials
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
