"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    let rafId: number | null = null;
    let pending = { x: -100, y: -100 };

    const flush = () => {
      rafId = null;
      el.style.transform = `translate3d(${pending.x}px, ${pending.y}px, 0)`;
      el.style.opacity = "1";
    };

    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (rafId === null) {
        rafId = requestAnimationFrame(flush);
      }
    };

    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.body.addEventListener("mouseleave", onLeave);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.body.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{
        transform: "translate3d(-100px, -100px, 0)",
        opacity: 0,
        willChange: "transform",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 18 18"
        className="-translate-x-1/2 -translate-y-1/2"
        fill="none"
      >
        <path d="M3 15L4 4L14 13L8 11L3 15Z" fill="#4d49fc" stroke="none" />
      </svg>
    </div>
  );
}
