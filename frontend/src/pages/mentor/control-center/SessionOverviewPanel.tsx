import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      color: "primary",
      glow: "rgba(99, 102, 241, 0.12)",
    },
    {
      icon: Activity,
      label: "Attendance Rate",
      value: `${overview?.attendancePercent ?? 0}%`,
      color: "purple",
      glow: "rgba(139, 92, 246, 0.12)",
    },
    {
      icon: Flame,
      label: "Engagement Score",
      value: `${overview?.engagementScore ?? 0}/100`,
      color: overview && overview.engagementScore >= 60 ? "success" : "warning",
      glow: overview && overview.engagementScore >= 60 ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
    },
    {
      icon: MessageSquare,
      label: "Questions",
      value: overview?.questionsWaiting ?? 0,
      color: "primary",
      glow: "rgba(99, 102, 241, 0.12)",
    },
    {
      icon: Hand,
      label: "Hands Up",
      value: overview?.raisedHands ?? 0,
      color: "warning",
      glow: "rgba(245, 158, 11, 0.12)",
    },
    {
      icon: Vote,
      label: "Active Polls",
      value: overview?.activePolls ?? 0,
      color: "purple",
      glow: "rgba(139, 92, 246, 0.12)",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card
            key={idx}
            className="mcc-card mcc-stat-card p-4 relative"
            style={{ "--glow-bg": `radial-gradient(circle at 50% 50%, ${item.glow}, transparent 65%)` } as React.CSSProperties}
          >
            <div className="card-content flex items-center gap-3">
              <div className={cn(
                "rounded-xl p-2.5",
                item.color === "success" && "bg-success/10 text-success border border-success/20",
                item.color === "warning" && "bg-warning/10 text-warning border border-warning/20",
                item.color === "primary" && "bg-primary/10 text-primary border border-primary/20",
                item.color === "purple" && "bg-purple-500/10 text-purple-400 border border-purple-500/20"
              )}>
                <Icon size={20} className="shrink-0" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold truncate">
                  {item.label}
                </p>
                <p className="text-xl font-bold text-white mt-0.5">{item.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
