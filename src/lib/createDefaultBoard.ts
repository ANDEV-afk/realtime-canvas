import prisma from "@/lib/prisma";

export async function createDefaultBoard(
  workspaceId: string,
  userId: string,
  title = "Untitled"
) {
  return prisma.board.create({
    data: {
      workspaceId,
      title,
      description: "Your first board",
      snapshot: {},
      createdById: userId,
      lastEditedById: userId,
    },
  });
}
