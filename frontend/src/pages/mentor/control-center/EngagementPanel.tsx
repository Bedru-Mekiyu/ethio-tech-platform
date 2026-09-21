import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, MessageSquare, Vote, Clock, Trophy } from "lucide-react";
import type { MentorControlData } from "@/services/mentorControlService";
import { cn } from "@/lib/utils";

interface EngagementPanelProps {
  scores: MentorControlData["engagementScores"];
}

export default function EngagementPanel({ scores }: EngagementPanelProps) {
  // Sort students by score descending
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <Card className="border-zinc-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-200">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Live Engagement Leaderboard</h3>
          </div>
        </div>
        <Badge variant="warning" className="h-5 px-1.5">
          {scores.length} Active Candidates
        </Badge>
      </div>

      {sortedScores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-zinc-400">No engagement data recorded for this session yet</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {sortedScores.map((es, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={String(es.student?._id)}
                className={cn(
                  "rounded-xl border p-3 flex items-center justify-between gap-3 transition-all hover:bg-zinc-50 shadow-2xs",
                  isTop3 ? "border-amber-200 bg-amber-50/40" : "border-zinc-200/80 bg-white",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center shrink-0 w-6 h-6">
                    {rank === 1 ? (
                      <span className="text-lg">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-lg">🥈</span>
                    ) : rank === 3 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-500">{rank}</span>
                    )}
                  </div>

                  <Avatar
                    name={es.student?.fullName}
                    src={es.student?.avatar}
                    size="sm"
                    className="h-9 w-9 rounded-lg"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{es.student?.fullName || "Unknown"}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-zinc-500">
                      <span className="flex items-center gap-0.5">
                        <MessageSquare size={10} /> Questions: {es.questionsAsked}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Vote size={10} /> Polls: {es.pollParticipations}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} /> Present: {Math.round(es.attendanceMs / 60000)}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Flame
                    size={14}
                    className={
                      es.score >= 70 ? "text-amber-500 fill-amber-500" : es.score >= 40 ? "text-zinc-700" : "opacity-40"
                    }
                  />
                  <span
                    className={cn(
                      "text-base font-bold",
                      es.score >= 70 ? "text-amber-600" : es.score >= 40 ? "text-zinc-800" : "text-zinc-500",
                    )}
                  >
                    {es.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
