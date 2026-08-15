"use client";

import { useDeleteComment, useDeleteThread, useErrorListener } from "@liveblocks/react";
import { useRef } from "react";

// Kitni der baad retry karna hai - itne time mein create ka HTTP request
// almost hamesha server pe commit ho chuka hota hai.
const RETRY_DELAY_MS = 1000;

/**
 * Mount this ONCE near the root of your board (e.g. alongside <CommentsCanvas />).
 *
 * Kya karta hai: agar user turant (create ke turant baad) delete/resolve
 * karta hai aur Liveblocks ka create-vs-delete race trigger ho jaata hai
 * (server abhi thread/comment ko janta hi nahi), toh Liveblocks ek error
 * throw karta hai instead of silently failing. Hum us error ko yahan catch
 * karke, thodi der baad WAHI mutation dobara try karte hain - user ko kuch
 * dikhta hi nahi, UI block nahi hoti, bas background mein self-heal ho
 * jaata hai.
 *
 * NOTE: Edit ka auto-retry isme jaan-boojh kar nahi diya - Liveblocks ke
 * error context mein edited body nahi milta (sirf threadId/commentId),
 * so hum retry pe purana text hi wapas bhej denge jo galat hoga. Edit ke
 * liye ThreadPin.tsx wala UI-guard (create ke turant baad thread ko
 * temporarily non-interactive rakhna) hi sahi/safe fix hai.
 */
export function CommentsSyncGuard() {
  const deleteComment = useDeleteComment();
  const deleteThread = useDeleteThread();

  // Ek hi mutation ko baar baar retry karte rehne se bachne ke liye
  const retriedKeys = useRef<Set<string>>(new Set());

  useErrorListener((error) => {
    const context = (error as any)?.context;
    if (!context?.type) return;

    switch (context.type) {
      case "DELETE_COMMENT_ERROR": {
        const key = `comment:${context.threadId}:${context.commentId}`;
        if (retriedKeys.current.has(key)) return; // already retried once
        retriedKeys.current.add(key);

        setTimeout(() => {
          deleteComment({
            threadId: context.threadId,
            commentId: context.commentId,
          });
        }, RETRY_DELAY_MS);
        break;
      }

      case "DELETE_THREAD_ERROR": {
        const key = `thread:${context.threadId}`;
        if (retriedKeys.current.has(key)) return;
        retriedKeys.current.add(key);

        setTimeout(() => {
          deleteThread(context.threadId);
        }, RETRY_DELAY_MS);
        break;
      }

      default: {
        // Baaki error types (edit, reaction, mark-as-read, etc.) - inme
        // se zyaadatar Liveblocks ke apne internal background calls hain
        // (jaise "mark thread as read" jab FloatingThread open hota hai)
        // jo naye thread ke saath race kar sakte hain. Ye harmless hote
        // hain (koi data delete/corrupt nahi hota), isliye console.error
        // ki jagah sirf debug-log karo taaki noise na ho.
        console.debug("[Liveblocks] non-critical sync error (ignored):", context.type);
        break;
      }
    }
  });

  return null;
}