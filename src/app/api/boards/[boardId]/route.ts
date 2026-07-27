import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getBoard(boardId: string, userId: string) {
  return prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    },
    include: {
      workspace: { select: { slug: true } },
      createdBy: { select: { name: true } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;

  // Direct Board Fetch - Workspace membership mandatory nahi hai link access ke liye
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: { select: { slug: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(board);
}

export async function PATCH(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const board = await getBoard(boardId, session.user.id);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Board title is required" }, { status: 400 });

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { title, lastEditedById: session.user.id },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const board = await getBoard(boardId, session.user.id);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.board.delete({ where: { id: boardId } });
  return NextResponse.json({ success: true });
}
