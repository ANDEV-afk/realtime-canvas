import { useMemo } from "react";
import { useThreads } from "@liveblocks/react/suspense";

export function useMaxZIndex() {
  const { threads } = useThreads();

  return useMemo(() => {
    let max = 0;
    for (const thread of threads) {
      const z = Number(thread.metadata?.zIndex || 0);
      if (z > max) {
        max = z;
      }
    }
    return max;
  }, [threads]);
}