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
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Polls</h4>
            {activePolls.map((poll) => (
              <div
                key={poll.pollId}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((option: PollOption, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 text-left whitespace-normal border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 text-slate-800 transition-colors"
                      onClick={() => onVote(poll.pollId, index)}
                      disabled={poll.hasVoted}
                    >
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="font-medium text-xs text-slate-900">{option.text}</span>
                        {poll.hasVoted && (
                          <span className="text-xs font-bold text-indigo-600">{option.percentage || 0}%</span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
                {poll.hasVoted && (
                  <p className="text-xs text-center text-emerald-700 font-medium">Your vote has been recorded</p>
                )}
              </div>
            ))}
          </div>
        )}

        {closedPolls.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous Polls</h4>
            {closedPolls.map((poll) => (
              <div
                key={poll.pollId}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-4 shadow-xs opacity-90"
              >
                <p className="font-semibold text-slate-900">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((option: PollOption, index: number) => (
                    <div
                      key={index}
                      className="relative overflow-hidden rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div
                        className="absolute inset-0 bg-indigo-100 transition-all duration-500"
                        style={{ width: `${option.percentage || 0}%` }}
                      />
                      <div className="relative flex justify-between px-3 py-2 text-sm text-slate-900 font-medium">
                        <span>{option.text}</span>
                        <span className="font-semibold">{option.percentage || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-right text-slate-500 font-medium">{poll.totalVotes} votes total</p>
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
