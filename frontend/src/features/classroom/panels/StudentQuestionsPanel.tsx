import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/composites/EmptyState";
import { ThumbsUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  questionId: string;
  text: string;
  userName: string;
  status: string;
  upvoteCount?: number;
  hasUpvoted?: boolean;
}

interface StudentQuestionsPanelProps {
  questions: Question[];
  onAskQuestion: (text: string) => void;
  onUpvote: (questionId: string) => void;
  currentUserId?: string;
}

export function StudentQuestionsPanel({ questions, onAskQuestion, onUpvote }: StudentQuestionsPanelProps) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onAskQuestion(text);
    setDraft("");
  };

  const pendingQuestions = questions.filter((q) => q.status === "pending" || q.status === "answering");
  const answeredQuestions = questions.filter((q) => q.status === "answered");

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Ask the mentor a question..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} aria-label="Ask question">
          <Send size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {pendingQuestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Up Next</h4>
            {pendingQuestions.map((q) => (
              <div
                key={q.questionId}
                className={cn(
                  "rounded-2xl border border-[var(--border)] p-3",
                  q.status === "answering" ? "bg-primary/10 border-primary/30" : "bg-white/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white">{q.text}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{q.userName}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 px-2 gap-1" onClick={() => onUpvote(q.questionId)}>
                    <ThumbsUp size={14} className={q.hasUpvoted ? "text-primary" : ""} />
                    <span>{q.upvoteCount || 0}</span>
                  </Button>
                </div>
                {q.status === "answering" && (
                  <p className="mt-2 text-xs font-medium text-primary">Being answered live...</p>
                )}
              </div>
            ))}
          </div>
        )}

        {answeredQuestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Answered</h4>
            {answeredQuestions.map((q) => (
              <div key={q.questionId} className="rounded-2xl border border-[var(--border)] bg-success/5 p-3 opacity-80">
                <p className="text-sm text-white">{q.text}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{q.userName}</span>
                  <span className="text-success font-medium">Answered</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {questions.length === 0 && (
          <div className="mt-8">
            <EmptyState title="No questions yet" description="Be the first to ask the mentor a question." />
          </div>
        )}
      </div>
    </div>
  );
}
