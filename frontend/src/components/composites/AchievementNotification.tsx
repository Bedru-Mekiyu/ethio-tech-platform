import { useEffect, useState, useRef } from "react";
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
  title: string;
  body: string;
  link?: string;
  at: string;
}

interface AchievementToastProps {
  socket: {
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
}

export function AchievementToast({ socket }: AchievementToastProps) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleNotification = (payload: unknown) => {
      const n = payload as NotificationPayload;
      if (n.type === "achievement" || n.type === "badge") {
        const id = `ach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setNotifications(prev => [...prev, { id, title: n.title, body: n.body, at: n.at }]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(x => x.id !== id));
        }, 6000);
      }
    };

    cleanupRef.current = socket.on("notification:new", handleNotification);
    return () => {
      cleanupRef.current?.();
    };
  }, [socket]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-300">{n.title}</p>
                <p className="text-xs text-gray-300 mt-0.5">{n.body}</p>
              </div>
              <button onClick={() => dismiss(n.id)} className="text-gray-400 hover:text-white flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
