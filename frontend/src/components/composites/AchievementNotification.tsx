import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";

interface AchievementNotification {
  id: string;
  title: string;
  body: string;
  at: string;
}

interface NotificationPayload {
  userId: string;
  notificationId: string;
  type: string;
  message: string;
  link?: string;
  at: string;
}

interface AchievementToastProps {
  socket: {
    on: (event: string, handler: (payload: unknown) => void) => void;
    off: (event: string, handler: (payload: unknown) => void) => void;
  };
}

export function AchievementToast({ socket }: AchievementToastProps) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);

  useEffect(() => {
    const handleNotification = (payload: unknown) => {
      const n = payload as NotificationPayload;
      if (n.type === "badge" || n.type === "xp") {
        const id = `ach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setNotifications((prev) => [...prev, { id, title: "Achievement Unlocked", body: n.message, at: n.at }]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((x) => x.id !== id));
        }, 6000);
      }
    };

    socket.on("notification:new", handleNotification);
    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [socket]);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className="bg-white border border-zinc-200 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{n.title}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{n.body}</p>
              </div>
              <button onClick={() => dismiss(n.id)} className="text-zinc-400 hover:text-zinc-700 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
