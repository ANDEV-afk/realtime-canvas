import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { boardId } = await params;
    const body = await req.json();
    const { targetWorkspaceId } = body;

    if (!targetWorkspaceId || typeof targetWorkspaceId !== "string") {
      return NextResponse.json(
        { error: "Target workspace ID is required" },
        { status: 400 }
      );
    }

    // 1. Verify board exists
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // 2. Verify user has access to current board's workspace
    const currentWorkspaceAccess = await prisma.workspace.findFirst({
      where: {
        id: board.workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!currentWorkspaceAccess) {
      return NextResponse.json({ error: "User does not have current board" }, { status: 403 });
    }

    // 3. Verify user has access to target workspace
    const targetWorkspaceAccess = await prisma.workspace.findFirst({
      where: {
        id: targetWorkspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!targetWorkspaceAccess) {
      return NextResponse.json(
        { error: "Target workspace not found or access denied" },
        { status: 403 }
      );
    }

    // 4. Update board workspaceId
    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        workspaceId: targetWorkspaceId,
        lastEditedById: session.user.id,
      },
    });

    return NextResponse.json(updatedBoard, { status: 200 });
  } catch (error) {
    console.error("Move Board Error:", error);
    return NextResponse.json(
      { error: "Failed to move board" },
      { status: 500 }
    );
  }
}
