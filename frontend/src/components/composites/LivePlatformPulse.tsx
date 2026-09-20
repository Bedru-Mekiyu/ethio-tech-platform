import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Video, Terminal, Code2, Globe } from "lucide-react";

const PLATFORM_EVENTS = [
  { icon: Video, message: "Addis Ababa Hub started a live session", region: "AA" },
  { icon: Terminal, message: "Kaleb completed a Python Capstone project", region: "Global" },
  { icon: Code2, message: "Mekelle Squad completed Sprint 2", region: "MK" },
  { icon: Users, message: "Senior Engineering Mentor joined live review", region: "Diaspora" },
  { icon: Globe, message: "Hawassa Hub joined the React Masterclass", region: "HW" },
];

export function LivePlatformPulse() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PLATFORM_EVENTS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const activeEvent = PLATFORM_EVENTS[currentIndex];
  const Icon = activeEvent.icon;

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200 bg-zinc-50/80 px-3 py-1 shadow-xs transition-colors">
      <div className="flex h-2 w-2 items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
      </div>

      <div className="flex items-center gap-2 overflow-hidden w-[260px] sm:w-[320px]">
        <Icon size={12} className="text-zinc-500 shrink-0" />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5 truncate text-[11px] text-zinc-700 font-medium"
          >
            <span className="truncate">{activeEvent.message}</span>
            <span className="text-zinc-400 shrink-0">•</span>
            <span className="text-zinc-500 font-normal shrink-0">{activeEvent.region}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
