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
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Up Next</h4>
            {pendingQuestions.map((q) => (
              <div
                key={q.questionId}
                className={cn(
                  "rounded-2xl border p-3.5 transition-all shadow-xs",
                  q.status === "answering" ? "bg-zinc-100 border-zinc-300" : "bg-white border-zinc-200/80",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 leading-snug">{q.text}</p>
                    <p className="mt-1 text-xs text-zinc-500">{q.userName}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 gap-1 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    onClick={() => onUpvote(q.questionId)}
                  >
                    <ThumbsUp size={14} className={q.hasUpvoted ? "text-zinc-900 fill-zinc-200" : "text-zinc-400"} />
                    <span className="font-semibold text-xs">{q.upvoteCount || 0}</span>
                  </Button>
                </div>
                {q.status === "answering" && (
                  <p className="mt-2 text-xs font-semibold text-[#b91c1c]">Being answered live...</p>
                )}
              </div>
            ))}
          </div>
        )}

        {answeredQuestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Answered</h4>
            {answeredQuestions.map((q) => (
              <div key={q.questionId} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 shadow-xs">
                <p className="text-sm font-medium text-zinc-900 leading-snug">{q.text}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>{q.userName}</span>
                  <span className="text-zinc-900 font-semibold">Answered</span>
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
