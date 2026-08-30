import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Play,
  Code2,
  Sparkles,
  Copy,
  Check,
  GraduationCap,
  Clock,
  Layers,
} from "lucide-react";
import { completeLesson, fetchLessonById } from "@/services/tracksService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { useAuthStore } from "@/store/authStore";
import { fetchMe } from "@/services/authService";

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [completed, setCompleted] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonById(lessonId!),
    enabled: !!lessonId,
  });

  const completeMutation = useMutation({
    mutationFn: () => completeLesson(lessonId!),
    onSuccess: async (result) => {
      setCompleted(true);
      if ((result as { alreadyCompleted?: boolean }).alreadyCompleted) return;
      const me = await fetchMe();
      setUser(me.user);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
  });

  const handleCopyStarter = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  if (isError) return <QueryError onRetry={() => refetch()} />;
  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
    );

  const lesson = data;
  const nextLessonId = lesson?.nextLessonId;
  const prevLessonId = lesson?.previousLessonId;
  const trackId = lesson?.trackId;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 px-4 sm:px-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={trackId ? `/app/tracks/${trackId}` : "/app/tracks"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft size={14} />
          Back to {lesson?.trackTitle ? `${lesson.trackTitle}` : "Track Overview"}
        </Link>

        {lesson?.durationMinutes && (
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <Clock size={13} className="text-primary" />
            {lesson.durationMinutes} min read & lab
          </span>
        )}
      </div>

      {/* Lesson Header Card */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {lesson?.moduleTitle && (
            <Badge variant="default" className="text-xs flex items-center gap-1">
              <Layers size={11} className="text-indigo-400" />
              {lesson.moduleTitle}
            </Badge>
          )}
          {lesson?.type && (
            <Badge variant="default" className="text-xs uppercase">
              {lesson.type.replace("-", " ")}
            </Badge>
          )}
          <Badge variant="success" className="text-xs font-medium">
            +{lesson?.xpReward ?? 50} XP
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
          {lesson?.title}
        </h1>

        {lesson?.summary && (
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            {lesson.summary}
          </p>
        )}
      </div>

      {/* Main Content Card */}
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
        {/* Prerequisites if any */}
        {lesson?.prerequisites && lesson.prerequisites.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={13} />
              Lesson Prerequisites
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lesson.prerequisites.map((req) => (
                <span
                  key={req}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text / Markdown Content */}
        <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed text-slate-300">
          <p className="whitespace-pre-wrap">
            {lesson?.content || "No detailed text has been published for this lesson yet."}
          </p>
        </div>

        {/* Starter Code Lab Box */}
        {lesson?.starterCode && (
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-1.5">
                <Code2 size={14} className="text-indigo-400" />
                Hands-On Code Sandbox Snippet
              </span>
              <button
                type="button"
                onClick={() => handleCopyStarter(lesson.starterCode!)}
                className="inline-flex items-center gap-1 text-indigo-400 hover:underline text-xs"
              >
                {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                {copiedCode ? "Copied to clipboard" : "Copy code"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d16] p-4 sm:p-5 font-mono text-xs text-slate-200">
              <pre>
                <code>{lesson.starterCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Challenge Task Box */}
        {lesson?.challengeTask && (
          <div className="rounded-xl border border-amber-500/30 bg-slate-950/50 p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              Interactive Challenge Task
            </p>
            <p className="text-sm text-slate-100 font-medium">{lesson.challengeTask}</p>
            <p className="text-xs text-slate-400">
              Test your solution locally or in the integrated coding workspace.
            </p>
          </div>
        )}

        {/* Video / Sandbox Links */}
        <div className="flex flex-wrap gap-3 pt-2">
          {lesson?.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition"
            >
              <Play size={15} className="text-indigo-400" />
              Open Video Workshop
            </a>
          )}

          {lesson?.codeSandboxUrl && (
            <a
              href={lesson.codeSandboxUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition"
            >
              <BookOpen size={15} className="text-indigo-400" />
              Open Interactive Sandbox
            </a>
          )}

          <Link to="/app/workspace">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Code2 size={15} />
              Open Workspace
            </Button>
          </Link>

          <Link to="/app/mentors">
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-slate-400 hover:text-slate-100">
              <GraduationCap size={15} />
              Ask a Mentor
            </Button>
          </Link>
        </div>
      </Card>

      {/* Action and Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          {prevLessonId && (
            <Link to={`/app/lessons/${prevLessonId}`}>
              <Button variant="outline" size="lg" className="text-xs">
                <ArrowLeft size={15} className="mr-1.5" />
                Previous Lesson
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {completed ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 font-medium">
              <CheckCircle size={18} />
              Completed (+{lesson?.xpReward ?? 50} XP)
            </div>
          ) : (
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              size="lg"
              className="gap-2 font-medium"
            >
              <Sparkles size={16} />
              {completeMutation.isPending ? "Recording progress..." : `Mark Complete (+${lesson?.xpReward ?? 50} XP)`}
            </Button>
          )}

          {nextLessonId ? (
            <Link to={`/app/lessons/${nextLessonId}`}>
              <Button size="lg" variant={completed ? "primary" : "outline"} className="gap-1.5 font-medium">
                Next Lesson
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            trackId && (
              <Link to={`/app/tracks/${trackId}`}>
                <Button size="lg" variant="outline" className="gap-1.5 font-medium">
                  Back to Track
                  <ArrowRight size={16} />
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
