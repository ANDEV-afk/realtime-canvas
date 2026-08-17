"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const COLLAGE_ITEMS = [
  // Left side floating cards
  {
    rotate: -6,
    left: "1%",
    top: "10%",
    w: 190,
    h: 140,
    bg: "#e4ff97",
    label: "Brainstorm",
    content: "sticky",
    yRange: [-35, 35, -35],
    duration: 5.5,
  },
  {
    rotate: 4,
    left: "3%",
    top: "46%",
    w: 205,
    h: 150,
    bg: "#ffc9c1",
    label: "Wireframe UI",
    content: "wireframe",
    yRange: [30, -40, 30],
    duration: 6.8,
  },
  {
    rotate: -3,
    left: "2%",
    top: "76%",
    w: 180,
    h: 120,
    bg: "#c7f8fb",
    label: "Architecture",
    content: "arch",
    yRange: [-25, 35, -25],
    duration: 6.2,
  },

  // Right side floating cards
  {
    rotate: 5,
    left: "82%",
    top: "8%",
    w: 200,
    h: 150,
    bg: "#c4baff",
    label: "User Flow",
    content: "flow",
    yRange: [35, -35, 35],
    duration: 5.8,
  },
  {
    rotate: -5,
    left: "81%",
    top: "44%",
    w: 190,
    h: 140,
    bg: "#e2e2e2",
    label: "Notes & Sync",
    content: "notes",
    yRange: [-40, 30, -40],
    duration: 6.5,
  },
  {
    rotate: 6,
    left: "80%",
    top: "74%",
    w: 195,
    h: 135,
    bg: "#c7f8fb",
    label: "Sprint Map",
    content: "kanban",
    yRange: [30, -30, 30],
    duration: 7.2,
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
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, (index % 2 === 0 ? 1 : -1) * 50]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: item.yRange,
        rotate: [item.rotate, item.rotate + (index % 2 === 0 ? 3 : -3), item.rotate],
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.1 + index * 0.08 },
        scale: { duration: 0.6, delay: 0.1 + index * 0.08 },
        y: { duration: item.duration, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: item.duration * 1.1, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{
        position: "absolute",
        left: item.left,
        top: item.top,
        width: item.w,
        height: item.h,
        translateY: scrollY,
        willChange: "transform",
      }}
      className="hidden select-none lg:block"
    >
      <div
        className="h-full overflow-hidden rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        style={{ background: item.bg }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black/50">
          {item.label}
        </span>

        {item.content === "sticky" && (
          <div className="mt-2 space-y-1.5">
            {["Ideas 💡", "Goals 🎯", "Ship it 🚀"].map((t) => (
              <div key={t} className="rounded bg-white/70 px-2 py-1 text-xs font-medium text-black">
                {t}
              </div>
            ))}
          </div>
        )}

        {item.content === "flow" && (
          <div className="mt-3 flex items-center gap-1.5">
            {["Start", "Design", "Build"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className="rounded-md bg-white/80 px-2 py-1 text-[10px] font-medium text-black shadow-sm">
                  {s}
                </div>
                {i < 2 && <span className="text-black/40 text-xs">→</span>}
              </div>
            ))}
          </div>
        )}

        {item.content === "wireframe" && (
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full rounded bg-black/15" />
            <div className="flex gap-1.5">
              <div className="h-9 flex-1 rounded bg-black/10" />
              <div className="h-9 flex-1 rounded bg-black/10" />
            </div>
            <div className="h-5 w-2/3 rounded bg-black/10" />
          </div>
        )}

        {item.content === "kanban" && (
          <div className="mt-2 flex gap-1.5">
            {["Todo", "Doing", "Done"].map((col) => (
              <div key={col} className="flex-1 space-y-1">
                <div className="text-[9px] font-medium text-black/50">{col}</div>
                <div className="h-5 rounded bg-white/70" />
                <div className="h-5 rounded bg-white/50" />
              </div>
            ))}
          </div>
        )}

        {item.content === "arch" && (
          <div className="mt-3 flex items-center justify-between gap-1">
            <div className="rounded bg-white/80 px-2 py-1 text-[10px] font-medium text-black">App</div>
            <div className="h-0.5 flex-1 bg-black/30 mx-1" />
            <div className="rounded bg-white/80 px-2 py-1 text-[10px] font-medium text-black">API</div>
          </div>
        )}

        {item.content === "notes" && (
          <div className="mt-2 space-y-1 font-mono text-[10px] text-black/70">
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
