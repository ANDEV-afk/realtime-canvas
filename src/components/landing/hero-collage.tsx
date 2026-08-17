"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const COLLAGE_ITEMS = [
  {
    rotate: -8,
    x: "-18%",
    y: "8%",
    w: 180,
    h: 140,
    bg: "#e4ff97",
    label: "Brainstorm",
    content: "sticky",
  },
  {
    rotate: 5,
    x: "72%",
    y: "-5%",
    w: 200,
    h: 160,
    bg: "#c4baff",
    label: "User Flow",
    content: "flow",
  },
  {
    rotate: -4,
    x: "-8%",
    y: "55%",
    w: 220,
    h: 150,
    bg: "#ffc9c1",
    label: "Wireframe",
    content: "wireframe",
  },
  {
    rotate: 12,
    x: "65%",
    y: "48%",
    w: 190,
    h: 130,
    bg: "#c7f8fb",
    label: "Sprint Map",
    content: "kanban",
  },
  {
    rotate: -6,
    x: "38%",
    y: "72%",
    w: 160,
    h: 120,
    bg: "#ffffff",
    label: "Sketch",
    content: "draw",
  },
  {
    rotate: 3,
    x: "85%",
    y: "25%",
    w: 140,
    h: 100,
    bg: "#e2e2e2",
    label: "Notes",
    content: "notes",
  },
];

function CollageCard({
  item,
  index,
  scrollYProgress,
}: {
  item: (typeof COLLAGE_ITEMS)[0];
  index: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const y = useTransform(scrollYProgress, [0, 1], [0, (index % 2 === 0 ? 1 : -1) * 60]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: item.rotate - 10 }}
      animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
      transition={{ delay: 0.2 + index * 0.08, duration: 0.6, type: "spring", stiffness: 120 }}
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        y,
      }}
      className="hidden select-none lg:block"
    >
      <div
        className="h-full overflow-hidden rounded-2xl border border-black/[0.06] p-3 shadow-sm"
        style={{ background: item.bg }}
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-black/40">
          {item.label}
        </span>
        {item.content === "sticky" && (
          <div className="mt-2 space-y-1.5">
            {["Ideas 💡", "Goals 🎯", "Ship it 🚀"].map((t) => (
              <div key={t} className="rounded bg-white/60 px-2 py-1 text-xs font-medium text-black/80">
                {t}
              </div>
            ))}
          </div>
        )}
        {item.content === "flow" && (
          <div className="mt-3 flex items-center gap-1">
            {["Start", "Design", "Build"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-medium">{s}</div>
                {i < 2 && <span className="text-black/30">→</span>}
              </div>
            ))}
          </div>
        )}
        {item.content === "wireframe" && (
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full rounded bg-black/10" />
            <div className="flex gap-1">
              <div className="h-8 flex-1 rounded bg-black/6" />
              <div className="h-8 flex-1 rounded bg-black/6" />
            </div>
            <div className="h-6 w-2/3 rounded bg-black/6" />
          </div>
        )}
        {item.content === "kanban" && (
          <div className="mt-2 flex gap-1.5">
            {["Todo", "Doing", "Done"].map((col) => (
              <div key={col} className="flex-1 space-y-1">
                <div className="text-[9px] text-black/40">{col}</div>
                <div className="h-5 rounded bg-white/60" />
                <div className="h-5 rounded bg-white/40" />
              </div>
            ))}
          </div>
        )}
        {item.content === "draw" && (
          <svg viewBox="0 0 120 80" className="mt-1 h-full w-full opacity-60">
            <path d="M10 60 Q40 10 70 50 T110 30" stroke="#4d49fc" strokeWidth="2" fill="none" />
            <circle cx="30" cy="40" r="12" fill="#00b6ff" opacity="0.5" />
            <rect x="60" y="20" width="30" height="20" rx="4" fill="#24cb71" opacity="0.4" />
          </svg>
        )}
        {item.content === "notes" && (
          <div className="mt-2 space-y-1 font-mono text-[10px] text-black/50">
            <p>// real-time sync</p>
            <p>// infinite canvas</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HeroCollage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      {COLLAGE_ITEMS.map((item, i) => (
        <CollageCard key={item.label} item={item} index={i} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}
