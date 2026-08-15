"use client";

import { useMaxZIndex } from "@/hooks/useMaxZIndex";
import { useSelf } from "@liveblocks/react";
import { useCallback, useEffect, useState } from "react";
import { useEditor } from "tldraw";
import { CommentPin, FloatingComposer } from "@liveblocks/react-ui";
import { MessageSquare } from 'lucide-react';

interface PlaceThreadButtonProps {
  isPlacing?: boolean; // external prop scene like toolbar, otherwise + button. 
  onStopPlacing?: () => void;
}
export function PlaceThreadButton({isPlacing,onStopPlacing}:PlaceThreadButtonProps){
  const editor = useEditor();
  const [internalState,setInternalState] = useState<"initial" | "placing" | "placed">("initial");
  const [worldCoords, setWorldCoords] = useState({ x: 0, y: 0 });
  const [screenCoords, setScreenCoords] = useState({ x: 0, y: 0 });

  // Tldraw se current theme check karo
  const isDark = editor ? editor.user.getIsDarkMode() : true;
  const themeAttribute: "dark" | "light" = isDark ? "dark" : "light";

  const activePlacing = isPlacing !== undefined ? isPlacing : internalState === "placing";

  const reset = useCallback(()=>{
    setInternalState("initial");  
    if(onStopPlacing) onStopPlacing();
  },[onStopPlacing]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!editor) return;

    const containerBounds = editor.getContainer().getBoundingClientRect();
    const clientX = e.clientX - containerBounds.left;
    const clientY = e.clientY - containerBounds.top;

    // Screen Viewport Point ko Tldraw Page Space mein transform karein
    const pagePoint = editor.screenToPage({ x: clientX, y: clientY });

    setWorldCoords({ x: pagePoint.x, y: pagePoint.y });
    setScreenCoords({ x: clientX, y: clientY });
    setInternalState("placed");
  };

  return (
    <>
      {isPlacing === undefined && ( // coming from internal state(means show + button)
        <div style={{position: "absolute", top: 12, right: 390, zIndex: 10000}}>
          <button
            onClick={() => setInternalState((prev) => (prev === "placing" ? "initial" : "placing"))}
            title="Add Comment"
            className="flex items-center justify-center text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity p-1"
          >
            <MessageSquare/>
          </button>
        </div>
      )}

      {/* Placing Overlay Backdrop */}
      {activePlacing && (
        <div
          style={{
            position: "absolute",
            inset: 0, 
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 99998,
            cursor: "none",
          }}
          onClick={handleCanvasClick}
          onContextMenu={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <NewThreadCursor theme={themeAttribute} />
        </div>
      )}

      {/* Click-away backdrop jab composer khula ho tab empty pin cancel karne ke liye */}
      {internalState === "placed" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 99990,
            }}
            onClick={reset}
          />
          <ThreadComposer
            worldCoords={worldCoords}
            screenCoords={screenCoords}
            onSubmit={reset}
            theme={themeAttribute}
          />
        </>
      )}
    </>
  );
}

function ThreadComposer({
  worldCoords,
  screenCoords,
  onSubmit,
  theme,
}: {
  worldCoords: {x: number, y:number};
  screenCoords: {x: number, y:number};
  onSubmit: ()=> void;
  theme: "dark" | "light";
}) {
  const creatorId = useSelf((me) => me.id);
  const maxZIndex = useMaxZIndex(); 

  return (
    <div
      data-lb-theme={theme}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate3d(${screenCoords.x}px, ${screenCoords.y}px, 0)`,
        zIndex: maxZIndex + 100,
        minWidth: "300px",
      }}
    >
      <FloatingComposer
        defaultOpen={true}
        metadata={{
          x: worldCoords.x,
          y: worldCoords.y,
          zIndex: maxZIndex + 1,
        }}
        onComposerSubmit={onSubmit}
        className="shadow-2xl rounded-xl"
      >
        <CommentPin userId={creatorId ?? undefined} corner="top-left" />
      </FloatingComposer>
    </div>
  )
}

interface NewThreadCursorProps {
  theme: "dark" | "light";
}

function NewThreadCursor({theme}: NewThreadCursorProps){
  const [coords,setCoords] = useState({x: -10000, y:-10000});
  const editor = useEditor();

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      if (!editor) return;
      const containerBounds = editor.getContainer().getBoundingClientRect();
      const x = e.clientX - containerBounds.left;
      const y = e.clientY - containerBounds.top;
      setCoords({ x, y });
    };

    document.addEventListener("mousemove", updatePosition, false);
    return () => {
      document.removeEventListener("mousemove", updatePosition);
    };
  }, [editor]);

  return (
    <div data-lb-theme={theme}>
      <CommentPin
      corner="top-left"
      style={{
        cursor: "none",
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
        zIndex: 999999,
      }}
    />
    </div>
  );
}