import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }){
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if(!session?.user?.id){return NextResponse.json({error: "Unauthorized",},{status: 401})};
    const {boardId} = await params;
    const {snapshot} = await req.json();

    if (!snapshot) {return NextResponse.json({ error: "Snapshot required" }, { status: 400 })};
    // Find highest version number currently saved for this board
    const lastSnapshot = await prisma.boardSnapshot.findFirst({
      where: { boardId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (lastSnapshot?.version ?? 0) + 1; // if 0 that means first version number 1.

    const newVersion = await prisma.boardSnapshot.create({
      data: {
        boardId,
        snapshot,
        version: nextVersion,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { name: true, image: true },
        },
      },
    });

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error("Create version error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all versions
export async function GET(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if(!session?.user?.id){return NextResponse.json({error: "Unauthorized",},{status: 401})};
    const { boardId } = await params;

    const versions = await prisma.boardSnapshot.findMany({
      where: { boardId },
      orderBy: { version: "desc" },
      include: {
        createdBy: {
          select: { name: true, image: true }, // image is the url of the user's profile picture
        },
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error("Fetch versions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}