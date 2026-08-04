import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// Restore version
export async function POST(req:NextRequest,{ params }: { params: Promise<{ boardId: string; versionId: string }>}){
  try {
    const session = await auth.api.getSession({headers: await headers()});

    if(!session?.user?.id){return NextResponse.json({error: "Unauthorized",},{status: 401})};

    const { boardId, versionId } = await params;

    // Check board ownership/permission
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { createdById: true },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (board.createdById !== session.user.id) { // owner can restore only
      return NextResponse.json(
        { error: "Only board owner can restore versions" },
        { status: 403 }
      );
    }

    // Fetch target version snapshot
    const targetSnapshot = await prisma.boardSnapshot.findUnique({
      where: { id: versionId },
    });

    if (!targetSnapshot) {
      return NextResponse.json(
        { error: "Version checkpoint not found" },
        { status: 404 }
      );
    }

    // Overwrite main Board live snapshot with selected version snapshot
    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        snapshot: targetSnapshot.snapshot as unknown as Prisma.InputJsonValue,
        lastEditedById: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Version restored successfully",
      snapshot: updatedBoard.snapshot,
    });
  } catch (error) {
    console.error("Restore version error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}