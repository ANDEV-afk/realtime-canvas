import Link from "next/link";
import { motion } from "motion/react";
import { CustomCursor } from "@/components/landing/custom-cursor";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        d="M21.35 11.1H12v2.99h5.37a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.95-4.28 2.95-7.31 0-.41-.04-.81-.1-1.2Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.67 0 4.9-.88 6.53-2.39l-3.22-2.5c-.9.6-2.05.96-3.31.96-2.55 0-4.71-1.72-5.48-4.04H3.2v2.58A9.86 9.86 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.52 14.03a5.9 5.9 0 0 1 0-3.76V7.69H3.2a9.98 9.98 0 0 0 0 8.92l3.32-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.93c1.45 0 2.76.5 3.79 1.47l2.84-2.84C16.89 2.92 14.67 2 12 2a9.86 9.86 0 0 0-8.8 5.69l3.32 2.58C7.29 7.65 9.45 5.93 12 5.93Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L19 21L12 17L5 21L12 2Z"
        fill="#4d49fc"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="1.5" fill="#ffffff" />
    </svg>
  );
}

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

const DIAGONAL_CARDS_1 = [
  { title: "Design Sprint 🚀", bg: "#4d49fc", text: "white" },
  { title: "User Flow Map", bg: "#24cb71", text: "black" },
  { title: "Wireframe UI", bg: "#ff7237", text: "white" },
  { title: "Architecture", bg: "#00b6ff", text: "black" },
];

const DIAGONAL_CARDS_2 = [
  { title: "Component Token", bg: "#e4ff97", text: "black" },
  { title: "Checkout UX", bg: "#c4baff", text: "black" },
  { title: "Kanban Backlog", bg: "#c7f8fb", text: "black" },
  { title: "Microservices", bg: "#ffc9c1", text: "black" },
];

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div
      className="relative flex h-screen w-screen cursor-none items-center justify-center overflow-hidden bg-[#09090b] px-4 py-4 text-white selection:bg-[#4d49fc]/20"
      style={{ fontFamily: "var(--font-figmasans)" }}
    >
      <CustomCursor />

      {/* Full-width background animation flowing seamlessly across left, center, and right behind the form */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[700px] rounded-full bg-gradient-to-tr from-[#4d49fc]/50 via-[#00b6ff]/30 to-transparent blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 size-[750px] rounded-full bg-gradient-to-bl from-[#ff7237]/45 via-[#24cb71]/35 to-transparent blur-[150px]" />

        {/* 4-column continuous full-width background card stream covering center behind form with hardware acceleration */}
        <div className="absolute inset-0 z-0 rotate-[-15deg] scale-150 opacity-35 grid grid-cols-4 gap-6 pointer-events-none px-6">
          {[DIAGONAL_CARDS_1, DIAGONAL_CARDS_2, DIAGONAL_CARDS_1, DIAGONAL_CARDS_2].map((colCards, colIdx) => (
            <motion.div
              key={colIdx}
              animate={{ y: colIdx % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
              transition={{ duration: 25 + colIdx * 5, repeat: Infinity, ease: "linear" }}
              style={{ willChange: "transform" }}
              className="flex flex-col gap-6 w-full"
            >
              {[...colCards, ...colCards].map((card, i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl p-4 shadow-md flex flex-col justify-between border border-white/20"
                  style={{ background: card.bg, color: card.text }}
                >
                  <div className="font-mono text-[10px] opacity-80">node_0{i + 1}</div>
                  <div className="text-base font-bold tracking-tight">{card.title}</div>
                  <div className="h-1.5 w-12 rounded-full bg-current opacity-30" />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="mb-4 flex justify-center">
          <Link href="/" data-cursor-hover className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <LogoMark />
            <span className="text-base font-medium tracking-tight text-white">CoolBoard</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/15 bg-[#18181b]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.8)] sm:p-8">
          <div className="mb-5 text-center">
            <h1 className="text-xl font-light tracking-[-0.24px] text-white">{title}</h1>
            <p className="mt-1 text-sm text-zinc-300">{description}</p>
          </div>

          <div className="space-y-4">{children}</div>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-zinc-300">
            {footer}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
