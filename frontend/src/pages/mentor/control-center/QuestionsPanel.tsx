import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, Send, Archive, Pin, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { answerQuestion, pinQuestion, archiveQuestion, setQuestionStatus } from "@/services/mentorControlService";
import type { MentorControlData } from "@/services/mentorControlService";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/composites/ToastProvider";

interface QuestionsPanelProps {
  questions: MentorControlData["questions"];
  sessionId: string;
}

export default function QuestionsPanel({ questions, sessionId }: QuestionsPanelProps) {
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const sortedAndFiltered = useMemo(() => {
    let list = [...questions];
    if (statusFilter !== "all") {
      list = list.filter((q) => q.status === statusFilter);
    }
    // Sort pinned questions first, then by upvotes descending, then by creation date ascending
    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [questions, statusFilter]);

  const handleAnswer = async (questionId: string) => {
    const text = answerText[questionId];
    if (!text?.trim()) return;
    setSubmittingId(questionId);
    try {
      await answerQuestion(sessionId, questionId, text);
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Answer failed", err);
      toast.error("Failed to submit answer");
    } finally {
      setSubmittingId(null);
    }
  };

  const handlePin = async (questionId: string) => {
    setSubmittingId(questionId);
    try {
      await pinQuestion(sessionId, questionId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Pin failed", err);
      toast.error("Failed to pin question");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleArchive = async (questionId: string) => {
    setSubmittingId(questionId);
    try {
      await archiveQuestion(sessionId, questionId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Archive failed", err);
      toast.error("Failed to archive question");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleStatusChange = async (questionId: string, newStatus: string) => {
    try {
      await setQuestionStatus(sessionId, questionId, newStatus);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Status change failed", err);
      toast.error("Failed to change question status");
    }
  };

  return (
    <Card className="border-slate-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 p-1.5 rounded-lg">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Q&A Queue</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 w-32 text-xs bg-white border-slate-200 text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="answering">Answering</option>
            <option value="answered">Answered</option>
            <option value="archived">Archived</option>
          </Select>
          <span className="text-xs text-slate-500">
            {questions.filter((q) => q.status === "pending").length} unanswered
          </span>
        </div>
      </div>

      {sortedAndFiltered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-slate-400">No questions in this category</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {sortedAndFiltered.map((q) => (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border p-3.5 transition-all shadow-2xs",
                q.isPinned ? "border-indigo-200 bg-indigo-50/50 shadow-xs" : "border-slate-200/80 bg-white",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    onClick={() => handlePin(q.id)}
                    title={q.isPinned ? "Unpin question" : "Pin question"}
                    disabled={submittingId === q.id}
                  >
                    <Pin size={14} className={q.isPinned ? "text-indigo-600 fill-indigo-600" : "opacity-60"} />
                  </Button>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
                    <ThumbsUp size={10} /> {q.upvoteCount}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-900">{q.studentName}</span>
                    <Badge
                      variant={
                        q.status === "pending"
                          ? "warning"
                          : q.status === "answering"
                            ? "default"
                            : q.status === "answered"
                              ? "success"
                              : "default"
                      }
                      className="text-[9px] px-1.5 py-0"
                    >
                      {q.status}
                    </Badge>
                    {q.isPinned && (
                      <Badge variant="purple" className="text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                        <Star size={8} className="fill-current" /> Pinned
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{q.text}</p>

                  {q.reply?.text && (
                    <div className="mt-2.5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5">
                      <p className="text-[10px] font-bold text-indigo-700">Response</p>
                      <p className="text-xs text-slate-800 mt-0.5">{q.reply.text}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Input
                      placeholder="Type response..."
                      className="h-8 text-xs flex-1 min-w-[150px] bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                      value={answerText[q.id] || ""}
                      onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleAnswer(q.id)}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs px-3"
                      onClick={() => handleAnswer(q.id)}
                      disabled={submittingId === q.id || !(answerText[q.id] || "").trim()}
                    >
                      <Send size={11} className="mr-1" /> {submittingId === q.id ? "Sending..." : "Reply"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => handleArchive(q.id)}
                      title="Archive Question"
                      disabled={submittingId === q.id}
                    >
                      <Archive size={14} />
                    </Button>
                    <Select
                      value={q.status}
                      onChange={(e) => handleStatusChange(q.id, e.target.value)}
                      className="h-8 w-24 text-xs bg-white border-slate-200 text-slate-800"
                    >
                      <option value="pending">Pending</option>
                      <option value="answering">Answering</option>
                      <option value="answered">Answered</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
