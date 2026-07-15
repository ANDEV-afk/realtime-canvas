import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

type BoardPageProps = { params: Promise<{ slug: string; boardId: string }>};

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug, boardId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        slug,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    },
    include: {
      workspace: true,
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-muted-foreground text-sm">{board.workspace.name}</p>
          <h1 className="text-xl font-semibold">{board.title}</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Created by {board.createdBy.name}
        </p>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="border-border bg-muted/30 text-muted-foreground flex h-full min-h-[420px] w-full max-w-5xl flex-col items-center justify-center rounded-3xl border border-dashed p-8 text-center">
          <p className="text-foreground text-lg font-medium">Board canvas coming soon</p>
          <p className="mt-2 max-w-md text-sm">
            Your workspace is ready. This board was created successfully and will be
            available here once the canvas editor is added.
          </p>
        </div>
      </main>
    </div>
  );
}
