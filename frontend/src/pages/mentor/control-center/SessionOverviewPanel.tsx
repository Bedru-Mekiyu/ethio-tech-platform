import { Card } from "@/components/ui/card";
import { Users, DoorOpen, Clock, Activity, Flame, MessageSquare, Hand, Vote } from "lucide-react";
import type { MentorControlData } from "@/services/mentorControlService";
import { cn } from "@/lib/utils";

interface SessionOverviewPanelProps {
  overview: MentorControlData["overview"] | undefined;
}

export default function SessionOverviewPanel({ overview }: SessionOverviewPanelProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m ${secs}s`;
  };

  const statItems = [
    {
      icon: Users,
      label: "Live Participants",
      value: overview?.liveParticipants ?? 0,
      color: "success",
      glow: "rgba(16, 185, 129, 0.12)",
    },
    {
      icon: DoorOpen,
      label: "Waiting Room",
      value: overview?.waitingParticipants ?? 0,
      color: "warning",
      glow: "rgba(245, 158, 11, 0.12)",
    },
    {
      icon: Clock,
      label: "Duration",
      value: overview?.sessionDuration ? formatDuration(overview.sessionDuration) : "0m 0s",
      color: "default",
      glow: "rgba(0, 0, 0, 0.04)",
    },
    {
      icon: Activity,
      label: "Attendance Rate",
      value: `${overview?.attendancePercent ?? 0}%`,
      color: "default",
      glow: "rgba(0, 0, 0, 0.04)",
    },
    {
      icon: Flame,
      label: "Engagement Score",
      value: `${overview?.engagementScore ?? 0}/100`,
      color: overview && overview.engagementScore >= 60 ? "secondary" : "warning",
      glow: "rgba(0, 0, 0, 0.04)",
    },
    {
      icon: MessageSquare,
      label: "Questions",
      value: overview?.questionsWaiting ?? 0,
      color: "default",
      glow: "rgba(0, 0, 0, 0.04)",
    },
    {
      icon: Hand,
      label: "Hands Up",
      value: overview?.raisedHands ?? 0,
      color: "warning",
      glow: "rgba(0, 0, 0, 0.04)",
    },
    {
      icon: Vote,
      label: "Active Polls",
      value: overview?.activePolls ?? 0,
      color: "default",
      glow: "rgba(0, 0, 0, 0.04)",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="mcc-card mcc-stat-card border-slate-200/80 bg-white p-4 relative shadow-sm">
            <div className="card-content flex items-center gap-3">
              <div
                className={cn(
                  "rounded-xl p-2.5 shrink-0",
                  item.color === "secondary" && "bg-blue-50 text-[var(--secondary)] border border-blue-100",
                  item.color === "warning" &&
                    "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400",
                  (item.color === "default" || !item.color) &&
                    "bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/[0.04] dark:border-white/10 dark:text-slate-300",
                )}
              >
                <Icon size={20} className="shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-600 font-medium font-semibold truncate">
                  {item.label}
                </p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{item.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
