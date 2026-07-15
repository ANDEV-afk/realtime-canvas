import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createDefaultBoard } from "@/lib/createDefaultBoard";
import { createInitialWorkspace } from "@/lib/createInitialWorkspace";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { User } from "@/generated/prisma/client";

export default async function WorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      ownerId: session.user.id,
    },
    include: {
      boards: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!workspace) {
    const result = await createInitialWorkspace(session.user as User);

    redirect(`/workspace/${result.workspace.slug}/board/${result.board.id}`);
  }

  const board =workspace.boards[0] ??(await createDefaultBoard(workspace.id, session.user.id));

  redirect(`/workspace/${workspace.slug}/board/${board.id}`);
}
