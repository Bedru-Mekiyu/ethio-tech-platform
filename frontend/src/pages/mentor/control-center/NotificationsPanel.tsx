import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Volume2, VolumeX, Hand, MessageSquare, Vote, DoorOpen, Users } from "lucide-react";
import { getSocket } from "@/services/socket";

interface NotificationItem {
  id: string;
  type: "join" | "leave" | "hand" | "question" | "poll" | "waiting";
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsPanelProps {
  sessionId: string;
}

export default function NotificationsPanel({ sessionId }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playEventSound = (type: string) => {
    if (!soundEnabled) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";

      // Different frequencies/notes for different events
      if (type === "hand") {
        osc.frequency.setValueAtTime(660, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      } else if (type === "question") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(698.46, ctx.currentTime + 0.1); // F5
      } else if (type === "waiting") {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      }

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn("Notification synth sound failed", err);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const addNotification = (type: NotificationItem["type"], message: string) => {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
      playEventSound(type);
    };

    socket.on("presence:join", () => {
      addNotification("join", `A student joined the session room`);
    });

    socket.on("presence:leave", () => {
      addNotification("leave", `A student disconnected from room`);
    });

    socket.on("hand:raised", () => {
      addNotification("hand", `Hand raised in queue`);
    });

    socket.on("question:new", () => {
      addNotification("question", `New question submitted to Q&A`);
    });

    socket.on("poll:created", () => {
      addNotification("poll", `New poll published to session`);
    });

    socket.on("waiting:queue", (p) => {
      if (p.queue && p.queue.length > 0) {
        addNotification("waiting", `${p.queue.length} student(s) waiting in admission queue`);
      }
    });

    return () => {
      socket.off("presence:join");
      socket.off("presence:leave");
      socket.off("hand:raised");
      socket.off("question:new");
      socket.off("poll:created");
      socket.off("waiting:queue");
    };
  }, [sessionId, soundEnabled]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotifIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "join":
        return <Users size={14} className="text-success" />;
      case "leave":
        return <VolumeX size={14} className="text-danger" />;
      case "hand":
        return <Hand size={14} className="text-primary" />;
      case "question":
        return <MessageSquare size={14} className="text-violet-400" />;
      case "poll":
        return <Vote size={14} className="text-purple-400" />;
      case "waiting":
        return <DoorOpen size={14} className="text-warning" />;
      default:
        return <Bell size={14} className="text-white" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-[500px] animate-slide-in">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 text-primary p-1.5 rounded-lg border border-primary/20">
            <Bell size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Real-time Alerts
              {unreadCount > 0 && (
                <Badge variant="danger" className="h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:text-white"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] border-white/10 text-white hover:bg-white/5"
              onClick={markAllRead}
            >
              Clear Badge
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mcc-scrollbar space-y-2 pr-1">
        {notifications.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-xs text-[var(--text-muted)]">No live events recorded yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${
                n.read ? "border-white/5 bg-white/[0.01]" : "border-primary/20 bg-primary/[0.01]"
              }`}
            >
              <div className="bg-white/5 p-1.5 rounded-lg shrink-0 mt-0.5">{getNotifIcon(n.type)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-medium leading-normal">{n.message}</p>
                <p className="text-[9px] text-[var(--text-secondary)] mt-1">{n.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
