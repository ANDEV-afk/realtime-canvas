"use client";

import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { CustomCursor } from "./custom-cursor";
import { HeroCollage } from "./hero-collage";
import { BoardMockup } from "./board-mockup";

const NAV_LINKS = ["Features", "Canvas", "Community"];

const TOOLS = ["✏️ Pen", "⬜ Shape", "📝 Sticky", "🔗 Connector", "💬 Comment", "🖼 Frame", "✨ Draw"];

const FEATURES = [
  {
    icon: "∞",
    title: "Infinite canvas",
    body: "Pan, zoom, and draw without boundaries. Your ideas never run out of room.",
  },
  {
    icon: "⚡",
    title: "Real-time sync",
    body: "See every cursor, stroke, and edit as it happens. Work together like you're in the same room.",
  },
  {
    icon: "📌",
    title: "Pinned comments",
    body: "Drop feedback directly on the board. Threads stay anchored to the work, not lost in chat.",
  },
  {
    icon: "⏱",
    title: "Version history",
    body: "Travel back to any snapshot. Explore iterations without losing a single mark.",
  },
];

const GALLERY = [
  {
    title: "Figma Design System v2.4",
    creator: "Aarav Sharma",
    bg: "#e4ff97",
    desc: "Core UI components & tokens",
    previewType: "wireframe",
  },
  {
    title: "Stripe Checkout Flow",
    creator: "Priya Patel",
    bg: "#c4baff",
    desc: "Payment UX wireframes",
    previewType: "flow",
  },
  {
    title: "Linear Triage Board",
    creator: "Rohan Gupta",
    bg: "#c7f8fb",
    desc: "Sprint backlog & epics",
    previewType: "kanban",
  },
  {
    title: "Architecture Microservices",
    creator: "Ananya Iyer",
    bg: "#ffc9c1",
    desc: "Distributed system topology",
    previewType: "arch",
  },
];

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

function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Link
        href={href}
        data-cursor-hover
        className={`inline-flex items-center justify-center rounded-[50px] bg-[#4d49fc] px-6 py-3 text-base font-medium text-white transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(77,73,252,0.35)] ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function GhostButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        data-cursor-hover
        className={`inline-flex items-center justify-center rounded-lg border border-black px-[20px] py-2.5 text-base font-normal text-black transition-colors duration-200 hover:bg-black/[0.03] dark:border-white/20 dark:text-white dark:hover:bg-white/10 ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

function PillButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
      <Link
        href={href}
        data-cursor-hover
        className="inline-flex items-center justify-center rounded-[50px] bg-black px-6 py-2.5 text-base font-medium text-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-200 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const [darkMode, setDarkMode] = useState(true);
  const [wipeTheme, setWipeTheme] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const handleThemeToggle = () => {
    setWipeTheme(true);
    setTimeout(() => {
      setDarkMode((prev) => !prev);
    }, 350);
    setTimeout(() => {
      setWipeTheme(false);
    }, 700);
  };

  return (
    <div
      className={`landing-page min-h-screen overflow-x-hidden cursor-none transition-colors duration-300 ${
        darkMode ? "dark bg-[#09090b] text-white" : "bg-white text-black"
      } selection:bg-electric-indigo/20`}
      style={{ fontFamily: "var(--font-figmasans)" }}
    >
      <CustomCursor />

      {/* Theme transition linear bottom-to-top wipe overlay */}
      <AnimatePresence>
        {wipeTheme && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-99999 bg-electric-indigo pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Nav */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-black/[0.06] bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-[#09090b]/85"
      >
        <div className="relative mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5"
            data-cursor-hover
          >
            <LogoMark />
            <span className="text-base font-medium tracking-tight">CoolBoard</span>
          </Link>

          <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(link.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
                }}
                data-cursor-hover
                className="text-base font-normal text-black/80 transition-colors duration-200 hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={handleThemeToggle}
              data-cursor-hover
              className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-black/[0.02] transition-colors hover:bg-black/[0.05] dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10"
              title="Toggle theme"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Link
              href="/login"
              data-cursor-hover
              className="hidden text-base text-black/80 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white sm:block"
            >
              Log in
            </Link>
            <PillButton href="/signup">Get Started</PillButton>
          </div>
        </div>
      </motion.header>

      {/* Sidelines container with crosshairs */}
      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-8 border-x border-black/10 dark:border-white/10">
        <div className="absolute -left-2 top-0 text-xs text-black/40 dark:text-white/40 pointer-events-none">+</div>
        <div className="absolute -right-2 top-0 text-xs text-black/40 dark:text-white/40 pointer-events-none">+</div>

        <main className="pt-28">
          {/* Hero */}
          <section
            ref={heroRef}
            className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-36 lg:py-44"
          >
            <HeroCollage />

            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale }}
              className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full rounded-2xl bg-white p-10 text-center shadow-[rgba(0,0,0,0.1)_0px_24px_70px_0px] dark:border dark:border-white/10 dark:bg-[#18181b] sm:p-14"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 font-mono text-xs tracking-[0.05em] text-[#595959] dark:text-zinc-400"
                >
                  infinite canvas · real-time · free to start
                </motion.p>

                <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-light leading-[1.1] tracking-[-0.84px] text-black dark:text-white">
                  Draw anything.
                  <br />
                  Together.
                </h1>

                <p className="mx-auto mt-6 max-w-md text-lg leading-[1.4] tracking-[-0.18px] text-[#595959] dark:text-zinc-400">
                  CoolBoard is the collaborative whiteboard for teams who think visually —
                  sketch, brainstorm, and ship on one infinite canvas.
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <PrimaryButton href="/signup">Start drawing free</PrimaryButton>
                  <GhostButton href="/login">See a demo</GhostButton>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Tools marquee */}
          <div className="my-12 overflow-hidden border-y border-black/[0.06] py-6 dark:border-white/10">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex w-max gap-12"
            >
              {[...TOOLS, ...TOOLS].map((tool, i) => (
                <span
                  key={`${tool}-${i}`}
                  className="whitespace-nowrap text-base font-normal text-[#595959] dark:text-zinc-400"
                >
                  {tool}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Product showcase */}
          <section id="canvas" className="py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="max-w-xl text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.84px]">
                Your team&apos;s creative workspace
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-[1.4] tracking-[-0.18px] text-[#595959] dark:text-zinc-400">
                Pen, shapes, sticky notes, and live cursors — everything you need to think out loud, together.
              </p>
            </motion.div>

            <div className="mt-16">
              <BoardMockup />
            </div>
          </section>

          {/* Features */}
          <section id="features" className="py-24 lg:py-32">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16 text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.84px]"
            >
              Built for visual thinkers
            </motion.h2>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  data-cursor-hover
                  className="group rounded-2xl border border-black/6 bg-white p-8 transition-shadow duration-300 hover:shadow-[rgba(0,0,0,0.06)_0px_16px_50px_0px] dark:border-white/10 dark:bg-[#18181b]"
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="mt-5 text-xl font-medium leading-[1.35] tracking-[-0.24px]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-base leading-[1.45] tracking-[-0.11px] text-graphite dark:text-zinc-400">
                    {feature.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Community gallery */}
          <section id="community" className="py-24 lg:py-32">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.84px]"
            >
              Boards from the community
            </motion.h2>
            <p className="mb-16 max-w-lg text-lg text-[#595959] dark:text-zinc-400">
              See what teams are creating on CoolBoard — from sprint maps to architecture diagrams.
            </p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {GALLERY.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  data-cursor-hover
                  className="group cursor-none overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/10 dark:bg-[#18181b]"
                >
                  <div
                    className="flex h-48 items-center justify-center p-6 transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{ background: item.bg }}
                  >
                    {item.previewType === "wireframe" && (
                      <div className="w-full space-y-2 rounded-xl bg-white/90 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-16 rounded bg-[#4d49fc]" />
                          <div className="size-3 rounded-full bg-black/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="h-10 rounded bg-black/5" />
                          <div className="h-10 rounded bg-black/5" />
                        </div>
                      </div>
                    )}
                    {item.previewType === "flow" && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white/90 px-3 py-2 text-[10px] font-medium text-black shadow-sm">Cart</div>
                        <span className="text-black/50 text-xs">→</span>
                        <div className="rounded-lg bg-[#4d49fc] px-3 py-2 text-[10px] font-medium text-white shadow-sm">Pay</div>
                        <span className="text-black/50 text-xs">→</span>
                        <div className="rounded-lg bg-white/90 px-3 py-2 text-[10px] font-medium text-black shadow-sm">Done</div>
                      </div>
                    )}
                    {item.previewType === "kanban" && (
                      <div className="flex w-full gap-2">
                        <div className="flex-1 rounded-lg bg-white/80 p-2 space-y-1">
                          <div className="h-2 w-8 rounded bg-black/30" />
                          <div className="h-6 rounded bg-black/10" />
                        </div>
                        <div className="flex-1 rounded-lg bg-white/80 p-2 space-y-1">
                          <div className="h-2 w-8 rounded bg-[#4d49fc]/60" />
                          <div className="h-6 rounded bg-[#4d49fc]/20" />
                        </div>
                      </div>
                    )}
                    {item.previewType === "arch" && (
                      <div className="relative flex w-full items-center justify-between px-2">
                        <div className="rounded-lg bg-white/90 p-2 text-[10px] font-medium text-black shadow-sm">Client</div>
                        <div className="h-0.5 flex-1 bg-black/30 mx-1 relative">
                          <div className="absolute -top-1.5 left-1/2 size-3 rounded-full bg-[#4d49fc]" />
                        </div>
                        <div className="rounded-lg bg-white/90 p-2 text-[10px] font-medium text-black shadow-sm">API</div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-medium tracking-[-0.24px]">{item.title}</h3>
                    <p className="mt-1 text-xs text-[#595959] dark:text-zinc-400">{item.desc}</p>
                    <div className="mt-3 flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-[#e2e2e2] text-xs font-medium text-black dark:bg-zinc-700 dark:text-white">
                        {item.creator[0]}
                      </span>
                      <span className="text-sm text-[#595959] dark:text-zinc-400">{item.creator}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section id="cta" className="pb-28 lg:pb-36">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center shadow-[rgba(0,0,0,0.1)_0px_24px_70px_0px] dark:border-white/10 dark:bg-[#18181b] lg:p-20"
            >
              <h2 className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.84px]">
                Make anything possible
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-[1.4] text-[#595959] dark:text-zinc-400">
                Unlimited boards, real-time collaboration, and version history — no credit card required.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <PrimaryButton href="/signup">Create your workspace</PrimaryButton>
                <Link
                  href="/login"
                  data-cursor-hover
                  className="inline-flex items-center justify-center rounded-[50px] border border-black/20 px-6 py-3 text-base font-normal text-black transition-all duration-200 hover:bg-black hover:text-white dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  I already have an account
                </Link>
              </div>
            </motion.div>
          </section>
        </main>
      </div>

      {/* Footer with whiteboard tools & resources only (no copyright line) */}
      <footer className="border-t border-black/[0.06] dark:border-white/10">
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-base font-medium tracking-tight">CoolBoard</span>
              </div>
              <p className="mt-4 text-sm text-[#595959] dark:text-zinc-400">
                The real-time collaborative canvas for teams who think visually.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white">Whiteboard Tools</h4>
              <ul className="mt-4 space-y-3 text-sm text-[#595959] dark:text-zinc-400">
                <li><span className="text-[#595959] dark:text-zinc-400">Infinite Canvas</span></li>
                <li><span className="text-[#595959] dark:text-zinc-400">Real-Time Sync</span></li>
                <li><span className="text-[#595959] dark:text-zinc-400">Sticky Notes & Cards</span></li>
                <li><span className="text-[#595959] dark:text-zinc-400">Vector Pen & Shapes</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white">Resources</h4>
              <ul className="mt-4 space-y-3 text-sm text-[#595959] dark:text-zinc-400">
                <li><span className="text-[#595959] dark:text-zinc-400">Community Gallery</span></li>
                <li><span className="text-[#595959] dark:text-zinc-400">Keyboard Shortcuts</span></li>
                <li><span className="text-[#595959] dark:text-zinc-400">Templates & Wireframes</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
