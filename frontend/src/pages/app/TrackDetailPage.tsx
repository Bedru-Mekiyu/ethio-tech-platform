import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  GraduationCap,
  Layers,
  Rocket,
  Sparkles,
  Video,
  Award,
  Copy,
  Check,
  Layers3,
} from "lucide-react";
import { fetchTrackById, type CapstoneProject } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { EmptyState } from "@/components/composites/EmptyState";
import { CapstonePreviewModal } from "@/components/composites/CapstonePreviewModal";
import { cn } from "@/lib/utils";

type DetailTab = "curriculum" | "capstones" | "competencies" | "career" | "prerequisites";

function TrackDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-8">
      <Skeleton className="h-6 w-36 rounded-full" />
      <Skeleton className="h-48 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-[30rem] rounded-[28px]" />
        <Skeleton className="h-[30rem] rounded-[28px]" />
      </div>
    </div>
  );
}

export function TrackDetailPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>("curriculum");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [selectedCapstone, setSelectedCapstone] = useState<CapstoneProject | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => fetchTrackById(trackId!),
    enabled: !!trackId,
  });

  const modules = data?.modules ?? [];
  const lessonCount = modules.reduce((sum, module) => sum + (module.lessons?.length ?? 0), 0);
  const estimatedXp =
    (data?.xpReward ?? 0) ||
    modules.reduce(
      (sum, module) =>
        sum + (module.lessons ?? []).reduce((lessonSum, lesson) => lessonSum + (lesson.xpReward ?? 0), 0),
      0
    );

  const handleCopySnippet = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      // ignore
    }
  };

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <QueryError onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) return <TrackDetailSkeleton />;

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Track not found"
          description="The learning pathway you are looking for may have moved or is not published yet."
          actionLabel="Browse all tracks"
          actionHref="/app/tracks"
        />
      </div>
    );
  }

  const firstLessonId = modules[0]?.lessons?.[0]?._id;

  return (
    <div className="page-shell py-8 space-y-8">
      {/* Capstone Preview Modal */}
      <CapstonePreviewModal
        project={selectedCapstone}
        trackTitle={data.title}
        trackId={data._id}
        isOpen={Boolean(selectedCapstone)}
        onClose={() => setSelectedCapstone(null)}
        isAppView={true}
      />

      {/* Back Link */}
      <div>
        <Link
          to="/app/tracks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft size={14} />
          Back to all tracks
        </Link>
      </div>

      {/* Hero Banner Card */}
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs">{data.category ?? "Core Track"}</Badge>
              <Badge variant="default" className="text-xs">{data.difficulty ?? "Intermediate"}</Badge>
              {data.marketDemand && (
                <Badge variant="success" className="text-xs font-medium">
                  <Sparkles size={12} className="mr-1 inline" />
                  {data.marketDemand.rating} Demand
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
              {data.title}
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-slate-400">
              {data.tagline || data.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {firstLessonId ? (
                <Link to={`/app/lessons/${firstLessonId}`}>
                  <Button size="lg" className="gap-2 font-medium">
                    <Rocket size={18} />
                    Start / Resume Track
                  </Button>
                </Link>
              ) : (
                <Link to="/app/workspace">
                  <Button size="lg" className="gap-2 font-medium">
                    <Rocket size={18} />
                    Open Workspace
                  </Button>
                </Link>
              )}

              <Link to="/app/workspace">
                <Button variant="outline" size="lg" className="gap-2 text-xs">
                  <Code2 size={18} />
                  Open Coding Lab
                </Button>
              </Link>

              <Link to="/app/mentors">
                <Button variant="secondary" size="lg" className="gap-2 text-xs">
                  <GraduationCap size={18} />
                  Book Mentor
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xl:w-[28rem] rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock size={11} className="text-indigo-400" />
                Duration
              </p>
              <p className="text-lg font-bold text-slate-100">{data.estimatedWeeks ?? 12} Weeks</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Video size={11} className="text-indigo-400" />
                Live Sessions
              </p>
              <p className="text-lg font-bold text-slate-100">{data.liveSessionsCount ?? 20}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <GraduationCap size={11} className="text-emerald-400" />
                1:1 Mentorship
              </p>
              <p className="text-lg font-bold text-slate-100">{data.mentorshipHours ?? 30} Hrs</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers size={11} className="text-indigo-400" />
                Modules
              </p>
              <p className="text-lg font-bold text-slate-100">{modules.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookOpen size={11} className="text-indigo-400" />
                Lessons
              </p>
              <p className="text-lg font-bold text-slate-100">{lessonCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Award size={11} className="text-amber-400" />
                Total XP
              </p>
              <p className="text-lg font-bold text-slate-100">+{estimatedXp} XP</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Tabs Header */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {[
          { key: "curriculum", label: "Modules & Lessons", icon: BookOpen },
          { key: "capstones", label: "Capstone Projects", icon: Code2 },
          { key: "competencies", label: "Skills & Tooling", icon: Cpu },
          { key: "career", label: "Career & Market", icon: Award },
          { key: "prerequisites", label: "Prerequisites", icon: CheckCircle2 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as DetailTab)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <TabIcon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Left Column: Active Tab Content */}
        <div className="space-y-6">
          {/* TAB 1: CURRICULUM */}
          {activeTab === "curriculum" && (
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Modular Learning Syllabus</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Structured progression from core architecture to full production delivery.
                  </p>
                </div>
                <Badge variant="default">{modules.length} Modules</Badge>
              </div>

              <div className="space-y-4">
                {modules.length > 0 ? (
                  modules.map((module, mIdx) => (
                    <div
                      key={module._id}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                            Module {mIdx + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 mt-1">{module.title}</h3>
                          {module.description && (
                            <p className="text-xs text-slate-400 mt-1">{module.description}</p>
                          )}
                        </div>
                        <Badge variant="default" className="text-xs">
                          {module.lessons?.length ?? 0} lessons
                        </Badge>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        {(module.lessons ?? []).map((lesson, lIdx) => (
                          <Link
                            key={lesson._id}
                            to={`/app/lessons/${lesson._id}`}
                            className="group/les flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-900"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-950 text-xs font-mono text-slate-400 group-hover/les:text-indigo-400">
                                {mIdx + 1}.{lIdx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-slate-200 group-hover/les:text-slate-100 transition line-clamp-1">
                                  {lesson.title}
                                </p>
                                {lesson.summary && (
                                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                    {lesson.summary}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              {lesson.durationMinutes && (
                                <span className="text-xs text-slate-400">
                                  {lesson.durationMinutes} min
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                                +{lesson.xpReward ?? 50} XP
                                <ArrowRight size={13} />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Curriculum being finalized"
                    description="The modules for this track are being synchronized with latest cohort standards."
                  />
                )}
              </div>
            </Card>
          )}

          {/* TAB 2: CAPSTONE PROJECTS */}
          {activeTab === "capstones" && (
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Practical Capstone Projects</h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-impact production projects reviewed by senior engineering mentors.
                </p>
              </div>

              <div className="space-y-5">
                {data.capstones && data.capstones.length > 0 ? (
                  data.capstones.map((capstone) => (
                    <div
                      key={capstone.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={capstone.difficulty === "Production-Grade" ? "success" : "default"}>
                              {capstone.difficulty}
                            </Badge>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} className="text-indigo-400" />
                              ~{capstone.estimatedHours} build hours
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-100 mt-2">{capstone.title}</h3>
                          <p className="text-xs text-indigo-400 font-medium mt-0.5">{capstone.tagline}</p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => setSelectedCapstone(capstone)}
                          className="gap-1.5 text-xs font-medium"
                        >
                          <Sparkles size={14} />
                          Inspect Blueprint
                        </Button>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {capstone.description}
                      </p>

                      {/* Architecture highlights */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                          <Cpu size={14} className="text-indigo-400" />
                          Key Architectural Highlights
                        </h4>
                        <ul className="space-y-1.5">
                          {capstone.architectureHighlights.map((hl, idx) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                              <span>{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Code Snippet Preview */}
                      {capstone.previewSnippet && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-mono">{capstone.previewSnippet.filename}</span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet(capstone.previewSnippet!.code, capstone.id)}
                              className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                            >
                              {copiedCodeId === capstone.id ? <Check size={13} /> : <Copy size={13} />}
                              {copiedCodeId === capstone.id ? "Copied" : "Copy Code"}
                            </button>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d16] p-4 font-mono text-xs text-slate-200">
                            <pre>
                              <code>{capstone.previewSnippet.code}</code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Tech stack */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-xs text-slate-400">Stack:</span>
                        {capstone.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 border border-slate-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Capstone projects in preview"
                    description="Capstone specifications will unlock as you advance through the syllabus."
                  />
                )}
              </div>
            </Card>
          )}

          {/* TAB 3: COMPETENCIES & TOOLING */}
          {activeTab === "competencies" && (
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Core Competencies & Industry Tooling</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Master the exact toolchains and design patterns required by modern engineering organizations.
                </p>
              </div>

              {/* Tooling chips */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Layers3 size={14} />
                  Tooling & Framework Ecosystem
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(data.tooling ?? []).map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-slate-200">{tool.name}</span>
                      <span className="text-[10px] text-slate-400">{tool.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competency groups */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Skill Mastery Matrix
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(data.competencyGroups ?? []).map((group) => (
                    <div
                      key={group.category}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2.5"
                    >
                      <h4 className="text-sm font-bold text-slate-100">{group.category}</h4>
                      <ul className="space-y-1.5">
                        {group.skills.map((skill) => (
                          <li key={skill} className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: CAREER & MARKET DEMAND */}
          {activeTab === "career" && (
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Target Career Roles & Market Dynamics</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Understand your hiring trajectory and compensation expectations upon completion.
                </p>
              </div>

              {/* Market demand overview */}
              {data.marketDemand && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="success">{data.marketDemand.rating} Demand Rating</Badge>
                    <span className="text-xs font-semibold text-indigo-400">{data.marketDemand.growthMetric}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{data.marketDemand.summary}</p>
                  <p className="text-xs text-slate-400">
                    Estimated Compensation Range: {data.marketDemand.salaryRange}
                  </p>
                </div>
              )}

              {/* Target career roles */}
              <div className="space-y-4">
                {(data.targetCareerRoles ?? []).map((role) => (
                  <div
                    key={role.role}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="default" className="text-[10px]">
                          {role.type}
                        </Badge>
                        <h3 className="text-base font-bold text-slate-100 mt-1">{role.role}</h3>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">{role.averageSalary}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {role.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {role.skillsMatched.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 5: PREREQUISITES */}
          {activeTab === "prerequisites" && (
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Skill Prerequisites & Readiness</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ensure you have foundational proficiency before undertaking this engineering pathway.
                </p>
              </div>

              <div className="space-y-4">
                {(data.prerequisites ?? []).map((req) => (
                  <div
                    key={req.skill}
                    className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100">{req.skill}</h3>
                        <Badge variant={req.level === "Required" ? "danger" : "default"} className="text-[10px]">
                          {req.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {req.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Track Snapshot, Mentorship, Action Card */}
        <div className="space-y-6">
          {/* Progress & Snapshot Widget */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div className="flex items-center gap-2 text-slate-400">
              <Layers size={15} className="text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Track Milestone Progress</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Curriculum Completion</span>
                <span className="font-bold text-slate-100">0%</span>
              </div>
              <ProgressBar value={0} max={100} className="h-2" />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Live Sessions</span>
                <span className="font-semibold text-slate-200">{data.liveSessionsCount ?? 20} Scheduled</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Mentor Code Reviews</span>
                <span className="font-semibold text-emerald-400">{data.mentorshipHours ?? 30} Hours Direct</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Capstone Checkpoints</span>
                <span className="font-semibold text-indigo-400">{data.capstones?.length ?? 2} Projects</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {firstLessonId && (
                <Link to={`/app/lessons/${firstLessonId}`} className="block">
                  <Button className="w-full font-medium" size="lg">
                    <Rocket size={16} className="mr-2" />
                    Open Next Lesson
                  </Button>
                </Link>
              )}

              <Link to="/app/workspace" className="block">
                <Button variant="outline" className="w-full text-xs">
                  <Code2 size={16} className="mr-2" />
                  Launch Workspace Sandbox
                </Button>
              </Link>
            </div>
          </Card>

          {/* Mentorship Support Card */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Assigned Senior Mentors</h3>
                <p className="text-xs text-slate-400">Available for architecture & code reviews</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Submit your capstone code commits to receive granular line-by-line feedback and attend weekly interactive
              cohort office hours.
            </p>
            <Link to="/app/mentors">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                Schedule Mentor 1:1
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
