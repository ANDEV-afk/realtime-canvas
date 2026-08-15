"use client"

import { useMaxZIndex } from "@/hooks/useMaxZIndex";
import { ThreadData } from "@liveblocks/client";
import { useEditThreadMetadata } from "@liveblocks/react";
import { CommentPin, FloatingThread } from "@liveblocks/react-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "tldraw";

// FIX #4: Naye thread ka `createThread` HTTP request server pe confirm hone
// mein thoda time (network round-trip) lagta hai. Agar is dauraan hi user
// "Delete comment" click kar de, to delete request create se pehle (ya
// usi waqt) server tak pahunch jaata hai - server ko thread ka pata hi
// nahi hota (abhi create commit nahi hua), delete fail hota hai, console
// error aata hai, aur create ka response baad mein aane par thread wapas
// UI mein reappear ho jaata hai (jaise deleted hi nahi hua).
//
// Fix: jab tak ye guard window active hai, hum poore interactive
// FloatingThread (jisme reply/resolve/delete/edit sab hote hain) ko mount
// hi nahi karte - sirf ek static, non-clickable pin dikhate hain. Isse
// delete us race-window mein trigger hi nahi ho sakta.
const CREATE_SYNC_GUARD_MS = 3000;

export function ThreadPin({ thread }: { thread: ThreadData }) {
  const editor = useEditor();
  const editThreadMetadata = useEditThreadMetadata();

  // Naye create hue thread ko auto-open rakhein
  const isBrandNew = useMemo(() => {
    return Number(new Date()) - Number(new Date(thread.createdAt)) <= 200;
  }, [thread.createdAt]);
  const [isOpen, setIsOpen] = useState(isBrandNew);
  const [isDragging, setIsDragging] = useState(false);
  const [localOffset, setLocalOffset] = useState<{ x: number; y: number } | null>(null);

  // FIX #4: is thread ka create-sync abhi pending hai ya nahi
  const [isSyncPending, setIsSyncPending] = useState(() => {
    return Number(new Date()) - Number(new Date(thread.createdAt)) < CREATE_SYNC_GUARD_MS;
  });

  useEffect(() => {
    if (!isSyncPending) return;
    const elapsed = Number(new Date()) - Number(new Date(thread.createdAt));
    const remaining = CREATE_SYNC_GUARD_MS - elapsed;
    if (remaining <= 0) {
      setIsSyncPending(false);
      return;
    }
    const timer = setTimeout(() => setIsSyncPending(false), remaining);
    return () => clearTimeout(timer);
    // thread.id change hone par (naya thread mount hua) guard re-evaluate ho
  }, [isSyncPending, thread.id, thread.createdAt]);

  const dragStartClient = useRef<{ x: number; y: number } | null>(null);
  const isDragMoved = useRef(false);
  // FIX #2: capture "was this open BEFORE the current click" so our toggle
  // can't race with FloatingThread's own outside-click dismiss handler,
  // which fires on pointerdown and closes the popover before our
  // pointerup runs. Reading `isOpen` at that point would already reflect
  // Radix's own close, so toggling off it would just re-open it — that
  // was the "needs 2 clicks to close" bug.
  const wasOpenRef = useRef(false);
  const maxZIndex = useMaxZIndex();

  // Sirf ye chhota wrapper ref karta hai pin (CommentPin) ko identify -
  // isse hum pointerDown pe check kar sakte hain ki click PIN pe hui thi
  // ya popup panel (reply/resolve/emoji/"..." menu) ke andar.
  const pinRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isBrandNew) setIsOpen(true);
  }, [isBrandNew]);

  // Liveblocks Metadata se Canvas Ground Coordinates
  const worldX = Number(thread.metadata?.x ?? 0);
  const worldY = Number(thread.metadata?.y ?? 0);

  // Tldraw Camera (Zoom/Pan) ke mutabiq Screen Coordinates Convert karna (container-relative)
  const baseScreenPoint = editor ? editor.pageToScreen({ x: worldX, y: worldY }) : { x: worldX, y: worldY };
  const screenPoint = {
    x: baseScreenPoint.x + (localOffset?.x ?? 0),
    y: baseScreenPoint.y + (localOffset?.y ?? 0),
  };

  const currentZIndex = isOpen ? maxZIndex + 10 : Number(thread.metadata?.zIndex || 1);

  // --- DRAG HANDLERS ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!pinRef.current?.contains(e.target as Node)) return;

    e.stopPropagation();
    e.preventDefault(); // FIX #3: stop the browser's native image-drag / text-select gesture from starting on the avatar <img>
    wasOpenRef.current = isOpen; // FIX #2: snapshot state BEFORE any dismiss-layer mutation this click may trigger
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    isDragMoved.current = false;
    setLocalOffset({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartClient.current || !editor) return;

    const dx = e.clientX - dragStartClient.current.x;
    const dy = e.clientY - dragStartClient.current.y;

    // 3px threshold to start actual drag
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (!isDragging) setIsDragging(true);
      isDragMoved.current = true;
      setLocalOffset({ x: dx, y: dy });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartClient.current) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

      if (isDragMoved.current && editor) {
        const finalScreenX = baseScreenPoint.x + (localOffset?.x ?? 0);
        const finalScreenY = baseScreenPoint.y + (localOffset?.y ?? 0);
        const newWorldPoint = editor.screenToPage({ x: finalScreenX, y: finalScreenY });

        editThreadMetadata({
          threadId: thread.id,
          metadata: {
            x: Math.round(newWorldPoint.x),
            y: Math.round(newWorldPoint.y),
          },
        });
      } else {
        // Normal click hua hai (No drag), toh popup toggle karo!
        // FIX #2: use the pre-click snapshot, not a `prev => !prev`
        // functional update, so we don't race with FloatingThread's
        // own outside-click close.
        setIsOpen(!wasOpenRef.current);
      }

      dragStartClient.current = null;
      setIsDragging(false);
      setLocalOffset(null);
    }
  };

  const handlePinClick = (e: React.MouseEvent) => {
    if (isDragMoved.current) {
      e.stopPropagation();
      e.preventDefault();
      isDragMoved.current = false;
    }
  };

  // FIX #4: guard window ke dauraan sirf ek static, non-interactive pin
  // render karo - FloatingThread mount hi nahi hota, isliye delete/reply/
  // resolve kuch bhi trigger nahi ho sakta jab tak create server pe
  // confirm na ho jaaye.
  if (isSyncPending) {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate3d(${screenPoint.x}px, ${screenPoint.y}px, 0)`,
          zIndex: currentZIndex,
          opacity: 0.7,
          pointerEvents: "none", // syncing ke dauraan clicks disabled
          userSelect: "none",
        }}
      >
        <CommentPin
          userId={thread.comments[0]?.userId}
          corner="top-left"
          data-lb-theme="dark"
        />
      </div>
    );
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClickCapture={handlePinClick}
      onDragStart={(e) => e.preventDefault()} // FIX #3: kills native HTML5 drag-ghost from the avatar <img>, which was fighting our own pointer-based drag
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate3d(${screenPoint.x}px, ${screenPoint.y}px, 0)`,
        zIndex: currentZIndex,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        WebkitUserDrag: "none",
      } as React.CSSProperties}
    >
      <FloatingThread
        thread={thread}
        open={isOpen}
        onOpenChange={setIsOpen}
        side="right"
        sideOffset={8}
        data-lb-theme="dark"
        className="dark"
      >
        {/*
          FIX #1: this used to be `display: "contents"`, which produces NO
          layout box — getBoundingClientRect() on it is (0,0,0,0). Since
          FloatingThread anchors its popover off THIS element, that made
          every thread pop open pinned to the screen's top-left corner
          (under the toolbar/sidebar), no matter where the pin actually
          was. `inline-flex` keeps the wrapper visually invisible (still
          hugs CommentPin exactly, no layout shift) but gives it a real,
          measurable rect so the popover anchors correctly next to the pin.
        */}
        <span
          ref={pinRef}
          style={{ display: "inline-flex", WebkitUserDrag: "none" } as React.CSSProperties}
          draggable={false}
        >
          <CommentPin
            userId={thread.comments[0]?.userId}
            corner="top-left"
            data-lb-theme="dark"
          />
        </span>
      </FloatingThread>
    </div>
  );
}