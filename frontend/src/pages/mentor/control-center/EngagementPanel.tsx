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
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-warning/15 text-warning p-1.5 rounded-lg border border-warning/20">
            <Trophy size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Engagement Leaderboard</h3>
          </div>
        </div>
        <Badge variant="warning" className="h-5 px-1.5">{scores.length} Active Candidates</Badge>
      </div>

      {sortedScores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No engagement data recorded for this session yet</p>
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
                  "rounded-xl border p-3 flex items-center justify-between gap-3 transition-all hover:bg-white/[0.03]",
                  isTop3
                    ? "border-warning/30 bg-warning/[0.02]"
                    : "border-white/5 bg-white/[0.01]"
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
                      <span className="text-xs font-bold text-[var(--text-muted)]">{rank}</span>
                    )}
                  </div>

                  <Avatar name={es.student?.fullName} src={es.student?.avatar} size="sm" className="h-9 w-9 rounded-lg" />
                  
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{es.student?.fullName || "Unknown"}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[var(--text-secondary)]">
                      <span className="flex items-center gap-0.5"><MessageSquare size={10} /> Questions: {es.questionsAsked}</span>
                      <span className="flex items-center gap-0.5"><Vote size={10} /> Polls: {es.pollParticipations}</span>
                      <span className="flex items-center gap-0.5"><Clock size={10} /> Present: {Math.round(es.attendanceMs / 60000)}m</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Flame size={14} className={es.score >= 70 ? "text-warning fill-warning" : es.score >= 40 ? "text-primary" : "opacity-40"} />
                  <span className={cn(
                    "text-base font-bold",
                    es.score >= 70 ? "text-warning" : es.score >= 40 ? "text-primary" : "text-[var(--text-muted)]"
                  )}>
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
