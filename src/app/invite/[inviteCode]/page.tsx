"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
  const params = useParams();
  const inviteCode = params?.inviteCode as string;
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // 1. Fetch Workspace Info
  useEffect(() => {
    if (!inviteCode) return;

    fetch(`/api/invite/${inviteCode}`)
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API Route missing or invalid");
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid invitation");
        return data;
      })
      .then((data) => {
        if (data) setWorkspace(data);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired invitation");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [inviteCode]);

  // 2. Accept / Join Action
  const handleAccept = async () => {
    if (!session) {
      router.push(`/login?redirect=/invite/${inviteCode}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`/api/invite/${inviteCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Joined workspace successfully!");
        router.push(`/workspace/${data.workspace?.id || workspace?.id}`);
      } else {
        toast.error(data.error || "Failed to join workspace");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans text-white">
      <div className="relative w-full max-w-md rounded-xl bg-[#1e1e1e] border border-[#2e2e2e] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-400">Loading invite details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 text-xs bg-[#2e2e2e] hover:bg-[#3e3e3e] px-4 py-2 rounded-lg transition-all"
            >
              Go to Homepage
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <p className="text-sm text-gray-300">
              You have been invited to join <br />
              <span className="font-semibold text-white text-base">{workspace?.name}</span>
            </p>

            <button
              onClick={handleAccept}
              disabled={joining || isSessionPending}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.98] py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50"
            >
              {(joining || isSessionPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSessionPending
                ? "Checking session..."
                : session
                ? "Accept invitation"
                : "Login to Accept"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}