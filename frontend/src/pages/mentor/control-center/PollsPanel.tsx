import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vote, Plus, PauseCircle, PlayCircle, Eye, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { createPoll, closePoll, reopenPoll, publishPollResults } from "@/services/mentorControlService";
import type { MentorControlData } from "@/services/mentorControlService";
import { useToast } from "@/components/composites/ToastProvider";

interface PollsPanelProps {
  polls: MentorControlData["polls"];
  sessionId: string;
}

export default function PollsPanel({ polls, sessionId }: PollsPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollType, setPollType] = useState<"single" | "multiple" | "true_false">("single");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const createDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = createDialogRef.current;
    if (!dialog) return;
    if (showCreate && !dialog.open) {
      dialog.showModal();
    } else if (!showCreate && dialog.open) {
      dialog.close();
    }
  }, [showCreate]);

  const handleCreate = async () => {
    if (!pollQuestion.trim()) return;
    const opts = pollType === "true_false" ? undefined : pollOptions.filter(Boolean);
    setIsSubmitting(true);
    try {
      await createPoll(sessionId, { question: pollQuestion, type: pollType, options: opts });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Create poll failed", err);
      toast.error("Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (pollId: string) => {
    setActionId(pollId);
    try {
      await closePoll(sessionId, pollId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Close poll failed", err);
      toast.error("Failed to close poll");
    } finally {
      setActionId(null);
    }
  };

  const handleReopen = async (pollId: string) => {
    setActionId(pollId);
    try {
      await reopenPoll(sessionId, pollId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Reopen poll failed", err);
      toast.error("Failed to reopen poll");
    } finally {
      setActionId(null);
    }
  };

  const handlePublish = async (pollId: string) => {
    setActionId(pollId);
    try {
      await publishPollResults(sessionId, pollId);
      queryClient.invalidateQueries({ queryKey: ["mentor-control", sessionId] });
    } catch (err) {
      console.error("Publish results failed", err);
      toast.error("Failed to publish poll results");
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-500/10 text-purple-400 p-1.5 rounded-lg border border-purple-500/20">
            <Vote size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Classroom Polls</h3>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-white rounded-lg"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={12} className="mr-1" /> Create Poll
        </Button>
        <dialog
          ref={createDialogRef}
          className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-0 text-white shadow-xl backdrop:bg-black/60"
          onCancel={(e) => {
            e.preventDefault();
            setShowCreate(false);
          }}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white">Create Poll</h2>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Question</label>
                <Input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask the class..."
                  className="bg-white/5 border-white/5 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Type</label>
                <Select value={pollType} onChange={(e) => setPollType(e.target.value as typeof pollType)}>
                  <SelectTrigger className="bg-white/5 border-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0F19] border-white/10 text-white">
                    <SelectItem value="single">Single Choice</SelectItem>
                    <SelectItem value="multiple">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pollType !== "true_false" && (
                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Options</label>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="bg-white/5 border-white/5 text-white"
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-danger hover:bg-danger/10"
                          onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                        >
                          <XCircle size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-white/10 hover:bg-white/5 text-white"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                    >
                      <Plus size={12} className="mr-1" /> Add Option
                    </Button>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-white"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/95 text-white"
                  onClick={handleCreate}
                  disabled={!pollQuestion.trim() || isSubmitting}
                >
                  {isSubmitting ? "Launching..." : "Launch Poll"}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      </div>

      {polls.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No polls created for this session yet</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {polls.map((poll) => (
            <div key={poll.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-semibold text-white">{poll.question}</p>
                <Badge variant={poll.status === "active" ? "success" : "default"} className="text-[9px] px-1.5 py-0">
                  {poll.status}
                </Badge>
              </div>
              <div className="text-[9px] text-[var(--text-secondary)] mb-3">
                {poll.type} · {poll.totalVotes} total responses
              </div>
              <div className="space-y-2">
                {poll.options.map((opt) => (
                  <div key={opt.index} className="relative h-8 rounded-lg bg-white/5 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                      style={{ width: `${opt.percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 h-full z-10 text-xs">
                      <span className="text-white font-medium">{opt.text}</span>
                      <span className="text-[var(--text-secondary)] font-semibold">
                        {opt.voteCount} ({opt.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3.5">
                {poll.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-white/10 hover:bg-white/5 text-white"
                    onClick={() => handleClose(poll.id)}
                    disabled={actionId === poll.id}
                  >
                    <PauseCircle size={11} className="mr-1" /> {actionId === poll.id ? "Ending..." : "End Poll"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-white/10 hover:bg-white/5 text-white"
                    onClick={() => handleReopen(poll.id)}
                    disabled={actionId === poll.id}
                  >
                    <PlayCircle size={11} className="mr-1" /> {actionId === poll.id ? "Re-launching..." : "Re-launch"}
                  </Button>
                )}
                {poll.status === "closed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-white/10 hover:bg-white/5 text-white"
                    onClick={() => handlePublish(poll.id)}
                    disabled={actionId === poll.id}
                  >
                    <Eye size={11} className="mr-1" /> {actionId === poll.id ? "Publishing..." : "Publish Results"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
