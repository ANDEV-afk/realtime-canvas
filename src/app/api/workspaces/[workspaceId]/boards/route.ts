import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const boards = await prisma.board.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(boards);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title } = await req.json();

  const board = await prisma.board.create({
    data: {
      workspaceId,
      title: title?.trim() || "Untitled",
      snapshot: {},
      createdById: session.user.id,
      lastEditedById: session.user.id,
    },
  });

  return NextResponse.json(board, { status: 201 });
}
