"use client";

import { useParams } from "next/navigation";
import { ActiveUsers } from "@/features/board/_components/ActiveUsers";
import { ShareModal } from "../ShareModal";

export const CustomShareZone = () => {
  const params = useParams();
  const boardId = params?.boardId as string;

  return (
    <div
      className="tlui-share-zone flex shrink-0 items-center gap-3 relative z-[9999]"
      draggable={false}
    >
      {/* Active Avatars Stack */}
      <ActiveUsers />

      {/* Main Combined Share & Export Popup */}
      <ShareModal boardId={boardId} />
    </div>
  );
};