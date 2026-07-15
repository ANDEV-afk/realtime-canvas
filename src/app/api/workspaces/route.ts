import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { WorkspaceRole } from "@/generated/prisma/client";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count++}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name, slug, ownerId: session.user.id },
    });
    await tx.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: session.user.id,
        role: WorkspaceRole.OWNER,
      },
    });
    const board = await tx.board.create({
      data: {
        workspaceId: ws.id,
        title: "Untitled",
        snapshot: {},
        createdById: session.user.id,
        lastEditedById: session.user.id,
      },
    });
    return { workspaceSlug: ws.slug, boardId: board.id };
  });

  return NextResponse.json(result, { status: 201 });
}
