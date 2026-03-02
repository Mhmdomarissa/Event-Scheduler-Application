"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const EVENTS = [
  { title: "Product Launch", time: "10:00 AM", color: "bg-indigo-500", attendees: 12 },
  { title: "Design Review", time: "2:00 PM", color: "bg-violet-500", attendees: 5 },
  { title: "Team Standup", time: "9:00 AM", color: "bg-sky-500", attendees: 8 },
  { title: "Client Demo", time: "4:30 PM", color: "bg-emerald-500", attendees: 3 },
];

function EventRow({ title, time, color, attendees, delay }: (typeof EVENTS)[0] & { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-lg bg-white/10 backdrop-blur px-3 py-2.5 text-white"
    >
      <span className={`size-2.5 rounded-full shrink-0 ${color}`} />
      <span className="flex-1 text-sm font-medium truncate">{title}</span>
      <span className="text-xs opacity-70 flex items-center gap-1">
        <Clock className="size-3" /> {time}
      </span>
      <span className="text-xs opacity-70 flex items-center gap-1">
        <Users className="size-3" /> {attendees}
      </span>
    </motion.div>
  );
}

export function Hero3D() {
  const rotateX = useMotionValue(10);
  const rotateY = useMotionValue(-15);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loop = animate(rotateY, [-15, 15, -15], {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => loop.stop();
  }, [rotateY]);

  const shadow = useTransform(
    rotateY,
    [-15, 15],
    ["40px 20px 80px rgba(99,102,241,0.35)", "-40px 20px 80px rgba(99,102,241,0.35)"],
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none flex items-center justify-center"
      style={{ perspective: "800px" }}
    >
      <motion.div
        style={{ rotateX, rotateY, boxShadow: shadow }}
        className="w-72 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 space-y-2"
      >
        {/* Calendar header */}
        <div className="flex items-center justify-between text-white mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="size-4" />
            <span>My Events</span>
          </div>
          <motion.span
            className="text-xs bg-white/20 rounded-full px-2 py-0.5"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Today
          </motion.span>
        </div>

        {EVENTS.map((event, i) => (
          <EventRow key={event.title} {...event} delay={0.3 + i * 0.15} />
        ))}

        {/* Conflict badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          className="mt-2 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-amber-200 text-xs"
        >
          <span className="font-semibold">⚠ Conflict detected</span>
          <span className="opacity-80">— Design Review overlaps</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
