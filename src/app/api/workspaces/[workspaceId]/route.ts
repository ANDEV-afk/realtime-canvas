import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getWorkspace(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(workspace);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (workspace.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the owner can update" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (workspace.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the owner can delete" }, { status: 403 });
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
  return NextResponse.json({ success: true });
}
