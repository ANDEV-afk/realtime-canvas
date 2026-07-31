import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Liveblocks } from "@liveblocks/node";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({secret: process.env.LIVEBLOCKS_SECRET_KEY!});
// ==========================================
// 1. POST: Liveblocks Realtime Token Auth
// ==========================================
export async function POST(request: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  try {
    const { boardId } = await params;

    // Resolve User or Guest Session
    const sessionData = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = sessionData?.user?.id || `guest_${Math.random().toString(36).substring(2, 9)}`;
    const userName = sessionData?.user?.name || "Guest User";
    const userAvatar = sessionData?.user?.image || "";

    // Query Board Access Mode
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { createdById: true, accessMode: true },
    });

    let isEditor = true;

    if (board) {
      if (sessionData?.user?.id && board.createdById === sessionData.user.id) {
        isEditor = true; // Owner is always Editor
      } else {
        isEditor = board.accessMode === "editor";
      }
    }

    // Create Liveblocks Session
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        color: sessionData?.user ? "#3b82f6" : "#10b981",
        avatar: userAvatar,
      },
    });

    if (isEditor) {
      session.allow(boardId, ["*:write"]);
    } else {
      session.allow(boardId, ["room:read", "room:presence:write"]);
    }

    const { body, status } = await session.authorize();

    return new NextResponse(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Single Access Route POST Error:", error);
    return NextResponse.json({ error: "Internal Auth Error" }, { status: 500 });
  }
}

// ==========================================
// 2. PATCH: Share Dropdown Permission Toggle
// ==========================================
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  try {
    const { boardId } = await params;

    const sessionData = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessMode } = await request.json(); // "editor" | "viewer"

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: { accessMode },
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Single Access Route PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update access mode" }, { status: 500 });
  }
}