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
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [completedLocally, setCompletedLocally] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonById(lessonId!),
    enabled: !!lessonId && !!user,
  });

  const completed = completedLocally || Boolean(data?.isCompleted);

  const completeMutation = useMutation({
    mutationFn: () => completeLesson(lessonId!),
    onSuccess: async (result) => {
      setCompletedLocally(true);
      if ((result as { alreadyCompleted?: boolean }).alreadyCompleted) return;
      const me = await fetchMe();
      setUser(me.user);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "student"] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
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
    <div className="mx-auto max-w-4xl space-y-6 py-6 px-4 sm:px-6 text-slate-900">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={trackId ? `/app/tracks/${trackId}` : "/app/tracks"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[var(--primary-hover)] transition"
        >
          <ArrowLeft size={13} />
          Back to {lesson?.trackTitle ? `${lesson.trackTitle}` : "Track Overview"}
        </Link>

        {lesson?.durationMinutes && (
          <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
            <Clock size={13} className="text-slate-600" />
            {lesson.durationMinutes} min
          </span>
        )}
      </div>

      {/* Lesson Header Card */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-4 sm:p-5 md:p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {lesson?.moduleTitle && (
              <Badge variant="outline" size="sm" className="flex items-center gap-1 border-slate-200">
                <Layers size={11} className="text-slate-600 font-medium" />
                {lesson.moduleTitle}
              </Badge>
            )}
            {lesson?.type && (
              <Badge variant="outline" size="sm" className="uppercase border-slate-200">
                {lesson.type.replace("-", " ")}
              </Badge>
            )}
            <Badge
              variant="outline"
              size="sm"
              className="border-blue-100 bg-blue-50/80 text-[var(--secondary)] font-bold font-mono"
            >
              +{lesson?.xpReward ?? 50} XP
            </Badge>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{lesson?.title}</h1>

          {lesson?.summary && <p className="text-xs text-slate-600 leading-relaxed font-normal">{lesson.summary}</p>}
        </div>
      </Card>

      {/* Main Content Card */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-4 sm:p-5 md:p-6 space-y-6 shadow-sm">
        {/* Prerequisites if any */}
        {lesson?.prerequisites && lesson.prerequisites.length > 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Code2 size={12} className="text-[var(--secondary)]" />
              Lesson Prerequisites
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lesson.prerequisites.map((req) => (
                <span
                  key={req}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text / Markdown Content */}
        <div className="prose max-w-none text-xs md:text-sm leading-relaxed text-slate-700 font-normal">
          <p className="whitespace-pre-wrap">
            {lesson?.content || "No detailed text has been published for this lesson yet."}
          </p>
        </div>

        {/* Starter Code Lab Box */}
        {lesson?.starterCode && (
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-mono flex items-center gap-1.5 text-slate-700 font-bold">
                <Code2 size={14} className="text-[var(--secondary)]" />
                Hands-On Code Sandbox Snippet
              </span>
              <button
                type="button"
                onClick={() => handleCopyStarter(lesson.starterCode!)}
                className="inline-flex items-center gap-1 text-primary hover:text-[var(--primary-hover)] text-xs font-semibold transition"
              >
                {copiedCode ? <Check size={13} className="text-[var(--secondary)]" /> : <Copy size={13} />}
                {copiedCode ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner">
              <pre>
                <code>{lesson.starterCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Challenge Task Box */}
        {lesson?.challengeTask && (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-4 sm:p-5 md:p-4 sm:p-5 md:p-6 space-y-1.5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <CheckCircle size={13} className="text-amber-600" />
              Interactive Challenge Task
            </p>
            <p className="text-xs text-slate-900 font-semibold">{lesson.challengeTask}</p>
            <p className="text-[11px] text-slate-600">
              Test your solution locally or in the integrated coding workspace.
            </p>
          </div>
        )}

        {/* Video / Sandbox Links */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {lesson?.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 transition shadow-2xs"
            >
              <Play size={13} className="text-[var(--secondary)]" />
              Video Workshop
            </a>
          )}

          {lesson?.codeSandboxUrl && (
            <a
              href={lesson.codeSandboxUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 transition shadow-2xs"
            >
              <BookOpen size={13} className="text-[var(--secondary)]" />
              Interactive Sandbox
            </a>
          )}

          <Link to="/app/workspace">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <Code2 size={14} className="text-[var(--secondary)]" />
              Open Workspace
            </Button>
          </Link>

          <Link to="/app/mentors">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
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
              <Button
                variant="outline"
                size="lg"
                className="text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft size={15} className="mr-1.5" />
                Previous Lesson
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {completed ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 font-semibold shadow-2xs">
              <CheckCircle size={18} className="text-emerald-600" />
              Completed (+{lesson?.xpReward ?? 50} XP)
            </div>
          ) : (
            <Button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              size="lg"
              className="gap-2 font-semibold rounded-xl shadow-xs"
            >
              <CheckCircle size={16} />
              {completeMutation.isPending ? "Recording progress..." : `Mark Complete (+${lesson?.xpReward ?? 50} XP)`}
            </Button>
          )}

          {nextLessonId ? (
            <Link to={`/app/lessons/${nextLessonId}`}>
              <Button
                size="lg"
                variant={completed ? "primary" : "outline"}
                className="gap-1.5 font-semibold rounded-xl shadow-xs"
              >
                Next Lesson
                <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            trackId && (
              <Link to={`/app/tracks/${trackId}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-1.5 font-semibold rounded-xl border-slate-200 hover:bg-slate-50"
                >
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
