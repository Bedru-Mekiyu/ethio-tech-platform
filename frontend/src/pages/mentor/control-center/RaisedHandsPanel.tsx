import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hand, Mic, Check } from "lucide-react";
import type { MentorControlData } from "@/services/mentorControlService";

interface RaisedHandsPanelProps {
  hands: MentorControlData["raisedHands"];
  sessionId: string;
  onAction: (action: string, userId: string) => void;
}

export default function RaisedHandsPanel({ hands, onAction }: RaisedHandsPanelProps) {
  const [now, setNow] = useState(() => Date.now());

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
    <Card className="border-slate-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-100 text-zinc-900 border border-zinc-200 p-1.5 rounded-lg">
            <Hand size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              Raised Hands
              <Badge variant="outline" className="h-5 px-1.5 bg-zinc-100 text-zinc-900 border-zinc-200">
                {hands.length}
              </Badge>
            </h3>
          </div>
        </div>
        {hands.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => onAction("clear-hands", "")}
          >
            Clear All
          </Button>
        )}
      </div>

      {hands.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-slate-400">No active hand raises</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 max-h-64 overflow-y-auto mcc-scrollbar pr-1">
          {hands.map((h, i) => (
            <div
              key={h.userId}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-900">
                  {h.queuePosition || i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{h.name}</p>
                  <p className="text-[9px] text-slate-500">Raised {getRelativeTime(h.raisedAt)}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] px-2 text-zinc-900 hover:bg-zinc-100 rounded-lg gap-1 font-medium"
                  onClick={() => onAction("call-on", h.userId)}
                  title="Call on student"
                >
                  Call On
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] px-2 text-[#b91c1c] hover:bg-red-50 hover:text-[#991b1b] rounded-lg gap-1 font-medium"
                  onClick={() => onAction("speaking_granted", h.userId)}
                  title="Grant speaking permission"
                >
                  <Mic size={12} /> Speaker
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg"
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
