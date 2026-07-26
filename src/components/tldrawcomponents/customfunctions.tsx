"use client";

import { ActiveUsers } from "@/features/board/_components/ActiveUsers";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const CustomShareZone = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="tlui-share-zone flex shrink-0 items-center gap-3 relative z-[9999]" draggable={false}>
      <ActiveUsers />

      {!session?.user ? (
        <button
          onClick={() => router.push("/login")}
          className="shrink-0 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap pointer-events-auto"
        >
          Sign in to share
        </button>
      ) : (
        <button
          onClick={handleShare}
          className="shrink-0 px-5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap pointer-events-auto"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      )}
    </div>
  );
};