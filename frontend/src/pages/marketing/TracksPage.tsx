import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
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
          (c) => c.title.toLowerCase().includes(q) || c.techStack.some((s) => s.toLowerCase().includes(q))
        );
        const inRoles = track.targetCareerRoles.some((r) => r.role.toLowerCase().includes(q));
        return inTitle || inShortTitle || inDescription || inTooling || inCapstones || inRoles;
      }
      return true;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const totalCapstones = useMemo(
    () => TRACKS_CATALOG.reduce((acc, t) => acc + t.capstones.length, 0),
    []
  );
  const totalLiveHours = useMemo(
    () => TRACKS_CATALOG.reduce((acc, t) => acc + t.liveSessionsCount + t.mentorshipHours, 0),
    []
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
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
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_60%)] py-20 lg:py-28">
        <div className="page-shell relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary"
            >
              <Sparkles size={14} />
              Industry-Standard Technical Curriculum
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="section-title text-4xl md:text-5xl lg:text-6xl tracking-tight"
            >
              Master In-Demand Tech with <br className="hidden sm:inline" />
              <span className="text-gradient">Production Capstones</span> & Mentorship
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto max-w-2xl text-base md:text-lg text-[var(--text-secondary)] leading-relaxed"
            >
              Forget static video tutorials. Build distributed cloud systems, real-time mobile apps, fraud detection
              engines, and hardened cybersecurity architectures with live code reviews.
            </motion.p>

            {/* Quick Metrics Bar */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4 sm:gap-4"
            >
              <Card className="border-[var(--border)] bg-white/5 p-4 text-center">
                <p className="text-3xl font-bold text-white">6</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">Core Tracks</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{totalCapstones}+</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">Real Capstones</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4 text-center">
                <p className="text-3xl font-bold text-secondary">{totalLiveHours}+</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">Live & Mentor Hrs</p>
              </Card>
              <Card className="border-[var(--border)] bg-white/5 p-4 text-center">
                <p className="text-3xl font-bold text-success">100%</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">Free for Learners</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="page-shell py-16 space-y-10">
        {/* Filters and Search Bar */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <Input
                type="text"
                placeholder="Search tracks, tooling, capstone projects, or career roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-[var(--border)] text-sm rounded-2xl focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Filter size={13} />
                Level:
              </span>
              {(["all", "Beginner", "Intermediate", "Advanced"] as DifficultyFilter[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                    selectedDifficulty === diff
                      ? "bg-primary text-black font-semibold"
                      : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
                  )}
                >
                  {diff === "all" ? "All Levels" : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs md:text-sm font-medium transition",
                  selectedCategory === cat.key
                    ? "bg-primary text-black shadow-md shadow-primary/20 font-semibold"
                    : "border border-[var(--border)] bg-white/5 text-[var(--text-secondary)] hover:border-primary/40 hover:text-white"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks List */}
        {filteredTracks.length > 0 ? (
          <div className="grid gap-8 lg:gap-10">
            {filteredTracks.map((track) => {
              const isSyllabusExpanded = expandedSyllabusId === track.id;

              return (
                <Card
                  key={track.id}
                  id={track.id}
                  className="group relative overflow-hidden rounded-[28px] border-[var(--border)] bg-[var(--bg-card)]/90 p-6 md:p-8 transition duration-200 hover:border-primary/40 hover:bg-[var(--bg-card-hover)]"
                >
                  <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Left Column: Track Info, Badges, Capstones, Career Roles */}
                    <div className="space-y-6">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={track.badgeColor}>{track.category}</Badge>
                        <Badge variant="default">{track.difficulty}</Badge>
                        <Badge variant="success">
                          <Sparkles size={12} className="mr-1 inline" />
                          {track.marketDemand.rating} Demand
                        </Badge>
                      </div>

                      {/* Header */}
                      <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                          {track.title}
                        </h2>
                        <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)]">
                          {track.tagline}
                        </p>
                      </div>

                      {/* Key stats bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl border border-white/5 bg-white/5 p-3.5 text-center">
                        <div>
                          <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                            <Clock size={12} className="text-primary" />
                            Duration
                          </p>
                          <p className="mt-1 font-semibold text-white text-sm">{track.estimatedWeeks} Weeks</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                            <Video size={12} className="text-secondary" />
                            Live Sessions
                          </p>
                          <p className="mt-1 font-semibold text-white text-sm">{track.liveSessionsCount} Workshops</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                            <GraduationCap size={12} className="text-success" />
                            1:1 Mentorship
                          </p>
                          <p className="mt-1 font-semibold text-white text-sm">{track.mentorshipHours} Hours</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                            <Award size={12} className="text-warning" />
                            XP Reward
                          </p>
                          <p className="mt-1 font-semibold text-white text-sm">+{track.xpReward} XP</p>
                        </div>
                      </div>

                      {/* Practical Capstones Showcase */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-primary flex items-center gap-1.5">
                            <Code2 size={14} />
                            Practical Capstone Projects
                          </h3>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Click to preview code & architecture
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
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
                              className="group/cap text-left rounded-2xl border border-[var(--border)] bg-black/30 p-4 transition hover:border-primary/50 hover:bg-white/5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="default" className="text-[10px] py-0.5">
                                  {capstone.difficulty}
                                </Badge>
                                <span className="text-[11px] text-primary flex items-center gap-1 opacity-80 group-hover/cap:opacity-100">
                                  View Code <ArrowRight size={12} />
                                </span>
                              </div>
                              <h4 className="mt-2 text-sm font-semibold text-white group-hover/cap:text-primary transition line-clamp-1">
                                {capstone.title}
                              </h4>
                              <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                {capstone.tagline}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {capstone.techStack.slice(0, 3).map((tech) => (
                                  <span
                                    key={tech}
                                    className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {capstone.techStack.length > 3 && (
                                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                                    +{capstone.techStack.length - 3}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tooling & Technologies */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] flex items-center gap-1.5">
                          <Cpu size={13} />
                          Core Tooling & Technologies
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {track.tooling.map((tool) => (
                            <span
                              key={tool.name}
                              className="rounded-xl border border-[var(--border)] bg-white/5 px-3 py-1 text-xs text-white"
                            >
                              {tool.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Visual, Career Outcomes, Prerequisites, CTAs */}
                    <div className="flex flex-col justify-between gap-6">
                      {/* Image Preview & Market Demand Card */}
                      <div className="relative overflow-hidden rounded-[24px] border border-white/10 aspect-[16/10] sm:aspect-[2/1] lg:aspect-[16/10]">
                        <SmartImage
                          unsplashId={track.unsplashId}
                          alt={track.title}
                          wrapperClassName="h-full w-full border-none bg-transparent"
                          className="h-full w-full object-cover"
                          width={800}
                          quality={80}
                          hoverEffect="zoom"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,10,20,0.95)] via-[rgba(5,10,20,0.4)] to-transparent p-5 flex flex-col justify-end">
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Market Insight
                          </p>
                          <p className="text-sm font-medium text-white mt-1">
                            {track.marketDemand.growthMetric}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Est. Compensation: {track.marketDemand.salaryRange}
                          </p>
                        </div>
                      </div>

                      {/* Career Outcomes Preview */}
                      <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] flex items-center gap-1.5">
                          <GraduationCap size={14} className="text-secondary" />
                          Target Career Outcomes
                        </p>
                        <div className="space-y-2">
                          {track.targetCareerRoles.map((role) => (
                            <div key={role.role} className="flex items-start justify-between gap-2 text-xs">
                              <span className="font-semibold text-white">{role.role}</span>
                              <span className="text-[var(--text-muted)]">{role.averageSalary}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prerequisites snippet */}
                      <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-success" />
                          Skill Prerequisites
                        </p>
                        <ul className="space-y-1">
                          {track.prerequisites.map((req) => (
                            <li key={req.skill} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="font-medium text-white">{req.skill}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">({req.level})</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSyllabusId(isSyllabusExpanded ? null : track.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                          <BookOpen size={16} />
                          {isSyllabusExpanded ? "Hide Syllabus" : "View Full Syllabus"}
                          {isSyllabusExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <Link to="/register" className="flex-1">
                          <Button className="w-full h-full py-3" variant="primary">
                            Enroll in This Track
                            <ArrowRight size={16} className="ml-2" />
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
                      transition={{ duration: 0.3 }}
                      className="mt-8 border-t border-[var(--border)] pt-6 space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">Full Modular Curriculum & Lessons</h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {track.modules.length} modules • Complete hands-on lesson breakdown
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {track.modules.map((module, mIdx) => (
                          <div
                            key={module._id}
                            className="rounded-2xl border border-[var(--border)] bg-black/40 p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                  Module {mIdx + 1}
                                </span>
                                <h4 className="text-sm font-semibold text-white mt-1">{module.title}</h4>
                              </div>
                              <Badge variant="purple" className="text-[10px]">
                                {module.lessons.length} lessons
                              </Badge>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {module.description}
                            </p>
                            <div className="space-y-1.5 pt-2 border-t border-white/5">
                              {module.lessons.map((lesson, lIdx) => (
                                <div
                                  key={lesson._id}
                                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5"
                                >
                                  <span className="text-[var(--text-secondary)] truncate">
                                    {mIdx + 1}.{lIdx + 1} {lesson.title}
                                  </span>
                                  <span className="text-[10px] text-primary font-medium flex-shrink-0 ml-2">
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
      <section className="border-t border-[var(--border)] bg-[rgba(5,10,20,0.6)] py-20">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Why EthioTech Tracks Are Built Differently
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Designed from the ground up for software engineering excellence, remote job readiness, and African innovation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="border-[var(--border)] bg-white/5 p-6 space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Code2 size={22} />
              </div>
              <h3 className="text-lg font-semibold text-white">Production-Grade Capstones</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                No trivial to-do apps. You will build multi-vendor e-commerce gateways, telemetry dashboards, and ML fraud scoring engines.
              </p>
            </Card>

            <Card className="border-[var(--border)] bg-white/5 p-6 space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                <Video size={22} />
              </div>
              <h3 className="text-lg font-semibold text-white">Live Socratic Mentorship</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Weekly live code breakdowns with experienced engineers working at Stripe, Microsoft, Google, Safaricom, and top startups.
              </p>
            </Card>

            <Card className="border-[var(--border)] bg-white/5 p-6 space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/15 text-success">
                <Award size={22} />
              </div>
              <h3 className="text-lg font-semibold text-white">Verified Skill Credentials</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Earn cryptographically verifiable track completion certificates and build an undeniable public GitHub portfolio.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="relative overflow-hidden border-t border-[var(--border)] bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.1))] py-16 text-center">
        <div className="page-shell space-y-6 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Begin Your Technical Journey?
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
            Join hundreds of Ethiopian students and developers learning together, building real projects, and advancing their careers.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/register">
              <Button size="lg" variant="primary">
                Join EthioTech for Free
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="outline">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
