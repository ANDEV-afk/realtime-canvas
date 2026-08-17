"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";

const LIVE_CURSORS = [
  { name: "Aarav", color: "#4d49fc", x: "35%", y: "40%" },
  { name: "Priya", color: "#24cb71", x: "62%", y: "28%" },
  { name: "Rohan", color: "#ff7237", x: "48%", y: "65%" },
];

const STICKIES = [
  { text: "Ship MVP 🚀", bg: "#e4ff97", x: 24, y: 32, rotate: -3 },
  { text: "User interviews", bg: "#c4baff", x: 180, y: 80, rotate: 4 },
  { text: "Fix nav layout", bg: "#ffc9c1", x: 320, y: 48, rotate: -2 },
  { text: "Q3 roadmap", bg: "#c7f8fb", x: 100, y: 160, rotate: 2 },
];

export function BoardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.98]);
  const [activeTool, setActiveTool] = useState("Pen");

  return (
    <motion.div
      ref={ref}
      style={{ y, scale }}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[rgba(0,0,0,0.1)_0px_24px_70px_0px] dark:border-white/10 dark:bg-[#18181b]"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-black/[0.06] px-4 py-2.5 dark:border-white/10">
        <div className="flex gap-1">
          {["Select", "Pen", "Shape", "Text", "Sticky", "Frame"].map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTool === tool
                  ? "bg-[#4d49fc] text-white shadow-sm"
                  : "text-[#595959] hover:bg-black/[0.04] hover:text-black dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-[#595959] dark:text-zinc-400">100%</span>
          <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black">
            Share
          </span>
        </div>
      </div>

      {/* Infinite canvas */}
      <div
        className="relative h-[340px] overflow-hidden sm:h-[420px] dark:bg-[#121214]"
        style={{
          backgroundImage: "radial-gradient(circle, #e2e2e2 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* Shapes on canvas */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
          <motion.path
            d="M60 280 Q180 120 340 220 T520 180"
            stroke="#4d49fc"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.rect
            x="400"
            y="100"
            width="80"
            height="60"
            rx="8"
            fill="#c7f8fb"
            stroke="#000"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
          />
          <motion.circle
            cx="520"
            cy="300"
            r="35"
            fill="#e4ff97"
            stroke="#000"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
          />
        </svg>

        {/* Sticky notes */}
        {STICKIES.map((note, i) => (
          <motion.div
            key={note.text}
            initial={{ opacity: 0, scale: 0.5, rotate: note.rotate - 10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: note.rotate }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className="absolute cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-black shadow-sm"
            style={{
              left: note.x,
              top: note.y,
              background: note.bg,
              transform: `rotate(${note.rotate}deg)`,
            }}
            data-cursor-hover
          >
            {note.text}
          </motion.div>
        ))}

        {/* Live cursors */}
        {LIVE_CURSORS.map((cursor, i) => (
          <motion.div
            key={cursor.name}
            className="absolute pointer-events-none"
            style={{ left: cursor.x, top: cursor.y }}
            animate={{ x: [0, 8, -4, 0], y: [0, -6, 4, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 13L2 1L12 10L7 8L1 13Z" fill={cursor.color} stroke="#000" strokeWidth="0.5" />
            </svg>
            <span
              className="ml-3 -mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ background: cursor.color }}
            >
              {cursor.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
