// components/header.tsx
"use client";

import { Suspense } from "react";
import { NotificationCenter } from "@/features/board/_components/NotificationCenter";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800 w-full h-14">
      <h1 className="text-sm font-semibold text-white">Canvas</h1>
      
      <Suspense
        fallback={
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse" />
        }
      >
        <NotificationCenter />
      </Suspense>
    </header>
  );
}