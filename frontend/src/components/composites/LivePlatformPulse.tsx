import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Video, Terminal, Code2, Globe } from "lucide-react";

const FAKE_EVENTS = [
  { icon: Video, message: "Addis Ababa Hub started a live session", region: "AA" },
  { icon: Terminal, message: "Kaleb just submitted a Python Capstone", region: "Global" },
  { icon: Code2, message: "Mekelle Squad completed Sprint 2", region: "MK" },
  { icon: Users, message: "Mentor Semira (Safaricom) joined online", region: "Diaspora" },
  { icon: Globe, message: "Hawassa Hub joined the React Masterclass", region: "HW" },
];

export function LivePlatformPulse() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FAKE_EVENTS.length);
    }, 6000); // rotate every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const activeEvent = FAKE_EVENTS[currentIndex];
  const Icon = activeEvent.icon;

  return (
    <div className="flex items-center gap-3 rounded-full border border-[#27272A] bg-[#0E0E11]/80 px-3 py-1.5 backdrop-blur-sm shadow-sm transition-all hover:border-zinc-700">
      <div className="relative flex h-2 w-2 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
      </div>

      <div className="flex items-center gap-2 overflow-hidden w-[260px] sm:w-[300px]">
        <Icon size={12} className="text-zinc-400 shrink-0" />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 truncate text-[11px] text-zinc-300"
          >
            <span className="truncate">{activeEvent.message}</span>
            <span className="text-zinc-600 shrink-0">•</span>
            <span className="text-emerald-500/70 font-medium shrink-0">Just now</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
