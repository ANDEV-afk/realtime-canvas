"use client";

import { useThreads } from "@liveblocks/react/suspense";
import { useState } from "react";
import { useEditor, useValue } from "tldraw";
import { PlaceThreadButton } from "./PlaceThreadButton";
import { ThreadPin } from "./ThreadPin";
import { CommentsSyncGuard } from "./CommentsSyncGuard";
import { CheckCircle2, Eye } from "lucide-react";

// FIX: pehle hum `editor.store.listen()` (bina scope ke, HAR store change
// pe fire hota - shapes/selection/pointer/camera sab) + manual "wheel"
// event listener use kar rahe the sirf re-render trigger karne ke liye.
// Ye dono tldraw ke apne internal render loop (jo requestAnimationFrame
// pe chalta hai) se OUT OF SYNC hote the - React ka re-render tldraw ke
// camera transform paint hone se ek frame aage/peeche fire ho sakta tha,
// jo fast pan/zoom mein pins ko "hilta"/lagging dikhata tha.
//
// `useValue` tldraw ka apna reactive signal hook hai - ye seedha unke
// internal rAF-batched render scheduling se tied hai, isliye camera
// change hone par re-render EXACTLY tabhi hota hai jab naya camera
// transform actually paint ho chuka ho. Ye jitter poori tarah khatam
// kar deta hai, aur code bhi chhota ho jaata hai (no manual listeners).
export function CommentsCanvas({ isCommentMode }: { isCommentMode?: boolean }) {
  const editor = useEditor();
  const { threads } = useThreads();

  // Camera (pan/zoom) badalte hi ye component automatically re-render
  // hoga - tldraw ke apne render cycle ke saath perfectly synced.
  useValue("camera", () => editor?.getCamera(), [editor]);

  // 👈 State for toggling resolved comments visiblity
  const [showResolved, setShowResolved] = useState(false);

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
        <div style={{ position: "fixed", top: 12, right: 446, zIndex: 10000, pointerEvents: "auto" }}>
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