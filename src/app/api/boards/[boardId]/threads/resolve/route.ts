import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// resolve status 
export async function PATCH(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params;
    const { threadId, resolved } = await req.json(); // true/false

    if (!threadId) {
      return NextResponse.json({ error: "Thread ID required" }, { status: 400 });
    }

    const updatedThread = await prisma.commentThread.update({
      where: { id: threadId },
      data: { resolved: Boolean(resolved) },
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error("Thread is not resolving....", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}