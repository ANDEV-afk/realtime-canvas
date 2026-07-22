import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { WorkspaceRole } from "@/generated/prisma/client";

export async function PATCH(req: NextRequest,{ params }: { params: Promise<{ workspaceId: string }> }) {
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
  if (!workspace) return NextResponse.json({ error: "Only the current owner can transfer ownership" }, { status: 403 });

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.update({
      where: { id: memberId },
      data: { role: WorkspaceRole.OWNER },
    });

    await tx.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
      data: { role: WorkspaceRole.EDITOR },
    });

    await tx.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: member.userId },
    });
  });

  return NextResponse.json({ success: true });
}
