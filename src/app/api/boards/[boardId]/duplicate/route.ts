import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { boardId } = await params;

    // 1. Purana board fetch karo DB se
    const existingBoard = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!existingBoard) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Verify user has access to the workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: existingBoard.workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Exact same snapshot/shapes data ke saath duplicate board create karo
    const duplicatedBoard = await prisma.board.create({
      data: {
        title: `${existingBoard.title} (Copy)`,
        workspaceId: existingBoard.workspaceId,
        snapshot: existingBoard.snapshot as unknown as Prisma.InputJsonValue,
        createdById: session.user.id,
        lastEditedById: session.user.id,
      },
    });

    return NextResponse.json(duplicatedBoard, { status: 201 });
  } catch (error) {
    console.error("Duplicate Board Error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate board" },
      { status: 500 }
    );
  }
}