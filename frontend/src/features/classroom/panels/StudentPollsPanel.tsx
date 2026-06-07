import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/composites/EmptyState";

interface PollOption {
  text: string;
  percentage?: number;
}

interface Poll {
  pollId: string;
  question: string;
  status: string;
  options: PollOption[];
  hasVoted?: boolean;
  totalVotes?: number;
}

interface StudentPollsPanelProps {
  polls: Poll[];
  onVote: (pollId: string, optionIndex: number) => void;
}

export function StudentPollsPanel({ polls, onVote }: StudentPollsPanelProps) {
  const activePolls = polls.filter((p) => p.status === "active");
  const closedPolls = polls.filter((p) => p.status !== "active");

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-1 overflow-y-auto space-y-4">
        {activePolls.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Live Polls</h4>
            {activePolls.map((poll) => (
              <div key={poll.pollId} className="rounded-2xl border border-[var(--border)] bg-white/5 p-4 space-y-4">
                <p className="font-medium text-white">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((option: PollOption, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 text-left whitespace-normal"
                      onClick={() => onVote(poll.pollId, index)}
                      disabled={poll.hasVoted}
                    >
                      <div className="flex w-full items-center justify-between gap-3">
                        <span>{option.text}</span>
                        {poll.hasVoted && (
                          <span className="text-xs text-[var(--text-muted)]">{option.percentage || 0}%</span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
                {poll.hasVoted && (
                  <p className="text-xs text-center text-[var(--text-muted)]">Your vote has been recorded</p>
                )}
              </div>
            ))}
          </div>
        )}

        {closedPolls.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Previous Polls</h4>
            {closedPolls.map((poll) => (
              <div
                key={poll.pollId}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4 opacity-80"
              >
                <p className="font-medium text-white">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((option: PollOption, index: number) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-lg bg-[var(--bg-base)] border border-[var(--border)]"
                    >
                      <div
                        className="absolute inset-0 bg-primary/20 transition-all duration-500"
                        style={{ width: `${option.percentage || 0}%` }}
                      />
                      <div className="relative flex justify-between px-3 py-2 text-sm text-white">
                        <span>{option.text}</span>
                        <span>{option.percentage || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-right text-[var(--text-muted)]">{poll.totalVotes} votes total</p>
              </div>
            ))}
          </div>
        )}

        {polls.length === 0 && (
          <div className="mt-8">
            <EmptyState title="No active polls" description="The mentor hasn't started any polls yet." />
          </div>
        )}
      </div>
    </div>
  );
}
