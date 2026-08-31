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
    <div className="mx-auto max-w-4xl space-y-6 py-6 px-4 sm:px-6 text-[var(--text-primary)]">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={trackId ? `/app/tracks/${trackId}` : "/app/tracks"}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:underline"
        >
          <ArrowLeft size={13} />
          Back to {lesson?.trackTitle ? `${lesson.trackTitle}` : "Track Overview"}
        </Link>

        {lesson?.durationMinutes && (
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock size={12} className="text-indigo-400" />
            {lesson.durationMinutes} min
          </span>
        )}
      </div>

      {/* Lesson Header Card */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {lesson?.moduleTitle && (
              <Badge variant="default" size="sm" className="flex items-center gap-1">
                <Layers size={10} className="text-indigo-400" />
                {lesson.moduleTitle}
              </Badge>
            )}
            {lesson?.type && (
              <Badge variant="default" size="sm" className="uppercase">
                {lesson.type.replace("-", " ")}
              </Badge>
            )}
            <Badge variant="success" size="sm" className="font-medium">
              +{lesson?.xpReward ?? 50} XP
            </Badge>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {lesson?.title}
          </h1>

          {lesson?.summary && (
            <p className="text-xs text-zinc-400 leading-relaxed">
              {lesson.summary}
            </p>
          )}
        </div>
      </Card>

      {/* Main Content Card */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-5 sm:p-6 space-y-5">
        {/* Prerequisites if any */}
        {lesson?.prerequisites && lesson.prerequisites.length > 0 && (
          <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={11} />
              Lesson Prerequisites
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {lesson.prerequisites.map((req) => (
                <span
                  key={req}
                  className="rounded-md border border-[#27272A] bg-[#0E0E11] px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text / Markdown Content */}
        <div className="prose prose-invert max-w-none text-xs md:text-sm leading-relaxed text-zinc-300">
          <p className="whitespace-pre-wrap">
            {lesson?.content || "No detailed text has been published for this lesson yet."}
          </p>
        </div>

        {/* Starter Code Lab Box */}
        {lesson?.starterCode && (
          <div className="space-y-2 pt-3 border-t border-[#27272A]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono flex items-center gap-1.5">
                <Code2 size={13} className="text-indigo-400" />
                Hands-On Code Sandbox Snippet
              </span>
              <button
                type="button"
                onClick={() => handleCopyStarter(lesson.starterCode!)}
                className="inline-flex items-center gap-1 text-indigo-400 hover:underline text-xs"
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#27272A] bg-[#141418] p-3.5 font-mono text-xs text-zinc-200">
              <pre>
                <code>{lesson.starterCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Challenge Task Box */}
        {lesson?.challengeTask && (
          <div className="rounded-lg border border-amber-500/30 bg-[#141418] p-4 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles size={12} />
              Interactive Challenge Task
            </p>
            <p className="text-xs text-white font-medium">{lesson.challengeTask}</p>
            <p className="text-[11px] text-zinc-400">
              Test your solution locally or in the integrated coding workspace.
            </p>
          </div>
        )}

        {/* Video / Sandbox Links */}
        <div className="flex flex-wrap gap-2 pt-1">
          {lesson?.videoUrl && (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#141418] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <Play size={12} className="text-indigo-400" />
              Video Workshop
            </a>
          )}

          {lesson?.codeSandboxUrl && (
            <a
              href={lesson.codeSandboxUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#141418] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            >
              <BookOpen size={12} className="text-indigo-400" />
              Interactive Sandbox
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
