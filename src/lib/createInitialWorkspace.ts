import prisma from "./prisma";
import { slugify } from "@/lib/utils";
import { User } from "@/generated/prisma/client";
import { WorkspaceRole } from "@/generated/prisma/client";

export async function createInitialWorkspace(user: User) {
  return prisma.$transaction(async (tx) => {
    const baseSlug = slugify(`${user.name}-workspace`);

    let slug = baseSlug;
    let count = 1;

    while (
      await tx.workspace.findUnique({
        where: { slug },
      })
    ) {
      slug = `${baseSlug}-${count++}`;
    }

    const workspace = await tx.workspace.create({
      data: {
        name: `${user.name}'s Workspace`,
        slug,
        ownerId: user.id,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: WorkspaceRole.OWNER,
      },
    });

    const board = await tx.board.create({
      data: {
        workspaceId: workspace.id,
        title: "Untitled",
        description: "Your first board",
        snapshot: {},
        createdById: user.id,
        lastEditedById: user.id,
      },
    });

    return {
      workspace,
      board,
    };
  });
}