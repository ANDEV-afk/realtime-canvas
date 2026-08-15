"use client";

import { useThreads } from "@liveblocks/react";
import { useEffect, useState } from "react";
import { useEditor } from "tldraw";
import { PlaceThreadButton } from "./PlaceThreadButton";
import { ThreadPin } from "./ThreadPin";
import { CommentsSyncGuard } from "./CommentsSyncGuard";
import { CheckCircle2, Eye } from "lucide-react";

// On canvas zoom, thread position can be same but on screen it's pixel position can be changed, So React does not know automatically to recalculate ThreadPin, so forcefully telling react to re-render to pin the position as canvas change. 
export function CommentsCanvas({ isCommentMode }: { isCommentMode?: boolean }) {
  const editor = useEditor();
  const { threads } = useThreads();
  const [, setTick] = useState(0); // forcing to re-render
  
  // 👈 State for toggling resolved comments visiblity
  const [showResolved, setShowResolved] = useState(false);

  // Jab canvas zoom/pan ho, pins ki onscreen coordinates refresh hongi
  useEffect(() => {
    if (!editor) return;
    const cleanup = editor.store.listen(() => {
      setTick((prev) => prev + 1);
    });

    const handleWheel = () => {
      setTick((prev) => prev + 1);
    };

    const container = editor.getContainer();
    container.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      cleanup();
      container.removeEventListener("wheel", handleWheel);
    };
  }, [editor]);

  // Filter threads based on resolve state
  const visibleThreads = (threads ?? []).filter((thread) => showResolved || !thread.resolved);

  const resolvedCount = (threads ?? []).filter((t) => t.resolved).length;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 400,
        overflow: "hidden",
      }}
    >
      {/* Create/delete/edit race-condition auto-retry - koi UI render nahi
          karta, sirf background mein error listen karke self-heal karta hai */}
      <CommentsSyncGuard />

      {/* Visual Control: Resolved Comments Toggle Button */}
      {resolvedCount > 0 && (
        <div style={{ position: "fixed", top: 12, right: 395, zIndex: 10000, pointerEvents: "auto" }}>
          <button
            onClick={() => setShowResolved((prev) => !prev)}
            title={showResolved ? "Hide Resolved Comments" : "Show Resolved Comments"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 shadow-md hover:bg-zinc-800 transition-all backdrop-blur-sm"
          >
            {showResolved ? (
              <>
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>Hide Resolved ({resolvedCount})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Show Resolved ({resolvedCount})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Canvas Comment Pins Layer */}
      <div style={{ pointerEvents: "auto" }}>
        {visibleThreads.map((thread) => (
          <ThreadPin key={thread.id} thread={thread} />
        ))}
      </div>

      {/* Comment Placement Controls */}
      <div style={{ pointerEvents: "auto" }}>
        <PlaceThreadButton isPlacing={isCommentMode} />
      </div>
    </div>
  );
}