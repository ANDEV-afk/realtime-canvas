import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// it is for reply no x,y needed here.
export async function POST(req:NextRequest,{params}:{params:Promise<{boardId:string}>}){
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await params;
    const { threadId, content } = await req.json();

    if (!threadId || !content?.trim()) {
      return NextResponse.json({ error: "Thread ID and content required" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        threadId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Reply error",error);
    return NextResponse.json({error: "Internal server error"},{status: 500});}
}