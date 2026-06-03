import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { DoorOpen, UserCheck, UserX, Volume2, VolumeX, Sparkles } from "lucide-react";
import type { MentorControlData } from "@/services/mentorControlService";

interface WaitingRoomPanelProps {
  queue: MentorControlData["waitingQueue"];
  sessionId: string;
  onAction: (action: string, userId: string) => void;
}

export default function WaitingRoomPanel({ queue, onAction }: WaitingRoomPanelProps) {
  const [autoAdmit, setAutoAdmit] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevQueueLength = useRef(queue.length);

  // Play Programmatic Web Audio API chime when queue increases
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Arpeggio sound
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn("Web Audio API chime failed", err);
    }
  };

  useEffect(() => {
    if (queue.length > prevQueueLength.current) {
      if (autoAdmit) {
        // Auto admit all new members
        queue.forEach((item) => {
          onAction("admit", item.userId);
        });
      } else if (soundEnabled) {
        playChime();
      }
    }
    prevQueueLength.current = queue.length;
  }, [queue, autoAdmit, soundEnabled, onAction]);

  return (
    <Card className="mcc-card border-warning/20 bg-warning/[0.02] p-4 flex flex-col h-full animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-warning/15 text-warning p-1.5 rounded-lg">
            <DoorOpen size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Waiting Room
              <Badge variant="warning" className="h-5 px-1.5">{queue.length} waiting</Badge>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-white"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </Button>
          <Button
            size="sm"
            variant={autoAdmit ? "primary" : "outline"}
            className="h-7 text-[10px] px-2 gap-1"
            onClick={() => setAutoAdmit(!autoAdmit)}
          >
            <Sparkles size={11} /> {autoAdmit ? "Auto-Admit ON" : "Auto-Admit"}
          </Button>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">No participants waiting</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 max-h-64 overflow-y-auto mcc-scrollbar pr-1">
          {queue.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={w.name} src={w.avatar} size="sm" className="h-8 w-8 rounded-lg shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{w.name}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">Joined {new Date(w.joinedAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-success hover:bg-success/15 hover:text-success rounded-lg"
                  onClick={() => onAction("admit", w.userId)}
                  title="Admit student"
                >
                  <UserCheck size={15} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-danger hover:bg-danger/15 hover:text-danger rounded-lg"
                  onClick={() => onAction("deny", w.userId)}
                  title="Deny student"
                >
                  <UserX size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 h-8 text-xs border-warning/30 hover:bg-warning/10 hover:text-warning"
          onClick={() => onAction("admit-all", "")}
        >
          <UserCheck size={13} className="mr-1.5" /> Admit All Candidates
        </Button>
      )}
    </Card>
  );
}
