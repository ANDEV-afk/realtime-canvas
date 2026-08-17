"use client";

import { motion } from "motion/react";

const COLUMN_1 = [
  {
    bg: "#e4ff97",
    label: "Brainstorm 💡",
    type: "sticky",
    title: "Quarterly Goals & MVP",
  },
  {
    bg: "#c4baff",
    label: "User Flow",
    type: "flow",
    title: "Auth & Workspace Onboarding",
  },
  {
    bg: "#ffc9c1",
    label: "Wireframe UI",
    type: "wireframe",
    title: "Infinite Canvas Toolbar",
  },
  {
    bg: "#c7f8fb",
    label: "Architecture",
    type: "arch",
    title: "CRDT WebSocket Relay",
  },
];

const COLUMN_2 = [
  {
    bg: "#c7f8fb",
    label: "Sprint Map 🎯",
    type: "kanban",
    title: "Sprint 14 Backlog",
  },
  {
    bg: "#e2e2e2",
    label: "Sync Engine",
    type: "notes",
    title: "60fps Cursor Broadcast",
  },
  {
    bg: "#e4ff97",
    label: "Design Tokens",
    type: "sticky",
    title: "Typography & Color Palette",
  },
  {
    bg: "#ffc9c1",
    label: "Checkout Flow",
    type: "flow",
    title: "Stripe Billing Integration",
  },
];

const COLUMN_3 = [
  {
    bg: "#c4baff",
    label: "Research Notes",
    type: "notes",
    title: "User Interview Feedback",
  },
  {
    bg: "#e4ff97",
    label: "Kanban Board",
    type: "kanban",
    title: "Feature Epics & Tasks",
  },
  {
    bg: "#c7f8fb",
    label: "Vector Layers",
    type: "wireframe",
    title: "Pen Tool Path Geometry",
  },
  {
    bg: "#ffc9c1",
    label: "Microservices",
    type: "arch",
    title: "Liveblocks Room Manager",
  },
];

function CardContent({ item }: { item: (typeof COLUMN_1)[0] }) {
  return (
    <div
      className="group relative h-48 w-64 shrink-0 rounded-2xl border border-black/[0.04] p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-black/10 dark:border-white/10 dark:hover:border-white/30"
      style={{ background: item.bg }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-black/60">
          {item.label}
        </span>
        <span className="size-2 rounded-full bg-black/20" />
      </div>

      <div className="mt-2 text-sm font-bold tracking-tight text-black line-clamp-1">
        {item.title}
      </div>

      {item.type === "sticky" && (
        <div className="mt-3 space-y-1.5">
          {["Sketch Ideas 🎨", "Multiplayer Sync ⚡", "Ship Live 🚀"].map((t) => (
            <div key={t} className="rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-medium text-black">
              {t}
            </div>
          ))}
        </div>
      )}

      {item.type === "flow" && (
        <div className="mt-4 flex items-center justify-between gap-1">
          {["Start", "Canvas", "Share"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="rounded-md bg-white/80 px-2 py-1 text-[10px] font-semibold text-black shadow-sm">
                {s}
              </div>
              {i < 2 && <span className="text-xs text-black/40">→</span>}
            </div>
          ))}
        </div>
      )}

      {item.type === "wireframe" && (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-black/15" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded bg-black/10" />
            <div className="h-10 flex-1 rounded bg-black/10" />
          </div>
        </div>
      )}

      {item.type === "kanban" && (
        <div className="mt-3 flex gap-2">
          {["Todo", "Doing", "Done"].map((col) => (
            <div key={col} className="flex-1 space-y-1.5">
              <div className="text-[9px] font-medium text-black/50">{col}</div>
              <div className="h-6 rounded bg-white/70" />
              <div className="h-4 rounded bg-white/50" />
            </div>
          ))}
        </div>
      )}

      {item.type === "arch" && (
        <div className="mt-4 flex items-center justify-between gap-1">
          <div className="rounded bg-white/80 px-2 py-1 text-[10px] font-medium text-black">Client</div>
          <div className="h-0.5 flex-1 bg-black/30 mx-1 relative">
            <div className="absolute -top-1 left-1/2 size-2 rounded-full bg-[#4d49fc]" />
          </div>
          <div className="rounded bg-white/80 px-2 py-1 text-[10px] font-medium text-black">Relay</div>
        </div>
      )}

      {item.type === "notes" && (
        <div className="mt-3 space-y-1 font-mono text-[10px] text-black/70">
          <p>// end-to-end sync</p>
          <p>// sub-5ms latency</p>
        </div>
      )}
    </div>
  );
}

export function HeroCollage() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden [perspective:1000px] [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
      <div className="flex h-[180%] w-[130%] -translate-x-[15%] -translate-y-[20%] items-center justify-center gap-10 [transform-style:preserve-3d] [transform:rotateX(22deg)_rotateY(-12deg)_rotateZ(12deg)] opacity-35 dark:opacity-20">
        {/* Column 1 - Downward stream */}
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="flex flex-col gap-6"
        >
          {[...COLUMN_1, ...COLUMN_1].map((item, i) => (
            <CardContent key={`col1-${i}`} item={item} />
          ))}
        </motion.div>

        {/* Column 2 - Upward stream */}
        <motion.div
          animate={{ y: ["-50%", "0%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex flex-col gap-6"
        >
          {[...COLUMN_2, ...COLUMN_2].map((item, i) => (
            <CardContent key={`col2-${i}`} item={item} />
          ))}
        </motion.div>

        {/* Column 3 - Downward stream */}
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="flex flex-col gap-6"
        >
          {[...COLUMN_3, ...COLUMN_3].map((item, i) => (
            <CardContent key={`col3-${i}`} item={item} />
          ))}
        </motion.div>

        {/* Column 4 - Upward stream */}
        <motion.div
          animate={{ y: ["-50%", "0%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex flex-col gap-6"
        >
          {[...COLUMN_1, ...COLUMN_1].map((item, i) => (
            <CardContent key={`col4-${i}`} item={item} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
