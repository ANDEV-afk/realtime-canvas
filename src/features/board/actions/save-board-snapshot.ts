"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";

export type SaveBoardSnapshotResult = { success: true } | { success: false; error: string };

export async function saveBoardSnapshot(boardId: string,document: Record<string, unknown>
): Promise<SaveBoardSnapshotResult> {
  // 1. Input Validation
  if (!boardId || typeof boardId !== "string") {
    return { success: false, error: "Invalid board ID" };
  }
  if (!document || typeof document !== "object") {
    return { success: false, error: "Invalid document snapshot" };
  }

  // 2. Authentication Check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // 3. Workspace Access Verification
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    },
    select: { id: true },
  });

  if (!board) {
    return { success: false, error: "Board not found or unauthorized" };
  }

  // 4. Update Board Record
  try {
    await prisma.board.update({
      where: { id: boardId },
      data: {
        snapshot: document as unknown as Prisma.InputJsonValue, // InputJsonValue is a type that represents a JSON value that can be stored in the database
        lastEditedById: session.user.id,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[saveBoardSnapshot] Persistence failed:", error);
    return { success: false, error: "Failed to save snapshot" };
  }
}