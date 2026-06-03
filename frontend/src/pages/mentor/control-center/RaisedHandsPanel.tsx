import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hand, Mic, MicOff, Check, Ban } from "lucide-react";
import type { MentorControlData } from "@/services/mentorControlService";

interface RaisedHandsPanelProps {
  hands: MentorControlData["raisedHands"];
  sessionId: string;
  onAction: (action: string, userId: string) => void;
}

export default function RaisedHandsPanel({ hands, sessionId, onAction }: RaisedHandsPanelProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (isoString: string) => {
    if (!isoString) return "";
    const diffMs = now - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins <= 0) return "just now";
    return `${diffMins}m ago`;
  };

  return (
    <Card className="mcc-card border-primary/20 bg-primary/[0.02] p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary p-1.5 rounded-lg">
            <Hand size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Raised Hands
              <Badge variant="primary" className="h-5 px-1.5">{hands.length}</Badge>
            </h3>
          </div>
        </div>
        {hands.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] text-[var(--text-secondary)] hover:text-white"
            onClick={() => onAction("clear-hands", "")}
          >
            Clear All
          </Button>
        )}
      </div>

      {hands.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">No active hand raises</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 max-h-64 overflow-y-auto mcc-scrollbar pr-1">
          {hands.map((h, i) => (
            <div key={h.userId} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {h.queuePosition || i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{h.name}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">Raised {getRelativeTime(h.raisedAt)}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] px-2 text-success hover:bg-success/15 hover:text-success rounded-lg gap-1 font-medium"
                  onClick={() => onAction("call-on", h.userId)}
                  title="Call on student"
                >
                  Call On
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] px-2 text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-400 rounded-lg gap-1 font-medium"
                  onClick={() => onAction("speaking_granted", h.userId)}
                  title="Grant speaking permission"
                >
                  <Mic size={12} /> Speaker
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white rounded-lg"
                  onClick={() => onAction("mark-answered", h.userId)}
                  title="Mark Answered"
                >
                  <Check size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
