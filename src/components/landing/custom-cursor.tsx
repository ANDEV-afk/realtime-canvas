"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);

    const onMove = (e: MouseEvent) => {
      if (!visible) setVisible(true);
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.body.addEventListener("mouseleave", onLeave);
    document.body.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.body.removeEventListener("mouseleave", onLeave);
      document.body.removeEventListener("mouseenter", onEnter);
    };
  }, [visible]);

  if (isTouch || !visible) return null;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{
        transform: "translate3d(-100px, -100px, 0)",
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
        <path
          d="M3 15L4 4L14 13L8 11L3 15Z"
          fill="#4d49fc"
          stroke="none"
        />
      </svg>
    </div>
  );
}
