"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export const CustomShareZone = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 300000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  // 1. Agar User Logged in NAHI hai -> "Sign in to share"
  if (!session?.user) {
    return (
      <div className="pointer-events-auto">
        <button
          onClick={() => router.push("/login")}
          className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md hover:shadow-xl transition-all duration-200 mr-3 mt-1 mb-2 cursor-pointer flex items-center gap-2"
        >
          <span>Sign in to share</span>
        </button>
      </div>
    );
  }

  // 2. Agar User Logged in HAI -> Full Share Button
  return (
    <div className="pointer-events-auto">
      <button
        onClick={handleShare}
        className="px-6 py-2 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium focus:ring-2 focus:ring-blue-400 hover:shadow-xl transition-all duration-200 mr-3 mt-1 mb-2 cursor-pointer flex items-center gap-2"
      >
        {copied ? (
          <span>Copied!</span>
        ) : (
          <span>Share</span>
        )}
      </button>
    </div>
  );
};