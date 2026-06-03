import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, Send, Archive, Pin, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { answerQuestion, pinQuestion, archiveQuestion, setQuestionStatus } from "@/services/mentorControlService";
import type { MentorControlData } from "@/services/mentorControlService";
import { cn } from "@/lib/utils";

interface QuestionsPanelProps {
  questions: MentorControlData["questions"];
  sessionId: string;
}

export default function QuestionsPanel({ questions, sessionId }: QuestionsPanelProps) {
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    try {
      await answerQuestion(sessionId, questionId, text);
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Answer failed", err);
    }
  };

  const handlePin = async (questionId: string) => {
    try {
      await pinQuestion(sessionId, questionId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Pin failed", err);
    }
  };

  const handleArchive = async (questionId: string) => {
    try {
      await archiveQuestion(sessionId, questionId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Archive failed", err);
    }
  };

  const handleStatusChange = async (questionId: string, newStatus: string) => {
    try {
      await setQuestionStatus(sessionId, questionId, newStatus);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Status change failed", err);
    }
  };

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary p-1.5 rounded-lg">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Q&A Queue</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 w-32 text-xs bg-white/5 border-white/5 text-white">
            <option value="all" className="bg-[#0B0F19]">All Statuses</option>
            <option value="pending" className="bg-[#0B0F19]">Pending</option>
            <option value="answering" className="bg-[#0B0F19]">Answering</option>
            <option value="answered" className="bg-[#0B0F19]">Answered</option>
            <option value="archived" className="bg-[#0B0F19]">Archived</option>
          </Select>
          <span className="text-xs text-[var(--text-muted)]">
            {questions.filter((q) => q.status === "pending").length} unanswered
          </span>
        </div>
      </div>

      {sortedAndFiltered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No questions in this category</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {sortedAndFiltered.map((q) => (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border p-3.5 transition-all animate-slide-in",
                q.isPinned
                  ? "border-primary/45 bg-primary/[0.03] shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                  : "border-white/5 bg-white/[0.01]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-white"
                    onClick={() => handlePin(q.id)}
                    title={q.isPinned ? "Unpin question" : "Pin question"}
                  >
                    <Pin size={14} className={q.isPinned ? "text-primary fill-primary" : "opacity-60"} />
                  </Button>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-0.5">
                    <ThumbsUp size={10} /> {q.upvoteCount}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{q.studentName}</span>
                    <Badge
                      variant={
                        q.status === "pending" ? "warning" :
                        q.status === "answering" ? "primary" :
                        q.status === "answered" ? "success" : "default"
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

                  <p className="text-xs text-[#E5E7EB] mt-1.5 leading-relaxed">{q.text}</p>

                  {q.reply?.text && (
                    <div className="mt-2.5 rounded-lg border border-primary/10 bg-primary/[0.02] p-2">
                      <p className="text-[10px] font-bold text-primary">Response</p>
                      <p className="text-xs text-white mt-0.5">{q.reply.text}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Input
                      placeholder="Type response..."
                      className="h-8 text-xs flex-1 min-w-[150px] bg-white/5 border-white/5 text-white"
                      value={answerText[q.id] || ""}
                      onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleAnswer(q.id)}
                    />
                    <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleAnswer(q.id)}>
                      <Send size={11} className="mr-1" /> Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                      onClick={() => handleArchive(q.id)}
                      title="Archive Question"
                    >
                      <Archive size={14} />
                    </Button>
                    <Select value={q.status} onChange={(e) => handleStatusChange(q.id, e.target.value)} className="h-8 w-24 text-xs bg-white/5 border-white/5 text-white">
                      <option value="pending" className="bg-[#0B0F19]">Pending</option>
                      <option value="answering" className="bg-[#0B0F19]">Answering</option>
                      <option value="answered" className="bg-[#0B0F19]">Answered</option>
                      <option value="archived" className="bg-[#0B0F19]">Archived</option>
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
