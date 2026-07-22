import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WorkspaceRole } from "@/generated/prisma/client";

export async function GET(req: NextRequest,{ params }: { params: Promise<{ workspaceId: string }> }) {
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

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest,{ params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: WorkspaceRole.OWNER } } },
      ],
    },
  });
  if (!workspace) return NextResponse.json({ error: "Not found or insufficient permissions" }, { status: 404 });

  const { email, role } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
  });
  if (existingMember) return NextResponse.json({ error: "User is already a member" }, { status: 400 });

  const memberRole = role && Object.values(WorkspaceRole).includes(role) ? role : WorkspaceRole.EDITOR;

  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      role: memberRole,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest,{ params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await params;
  const { memberId } = await req.json();

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      ownerId: session.user.id,
    },
  });
  if (!workspace) return NextResponse.json({ error: "Only the owner can remove members" }, { status: 403 });

  if (memberId === session.user.id) {
    return NextResponse.json({ error: "Owner cannot remove themselves" }, { status: 400 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  return NextResponse.json({ success: true });
}
