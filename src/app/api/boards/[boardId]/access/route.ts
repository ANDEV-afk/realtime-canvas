import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Liveblocks } from "@liveblocks/node";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const liveblocks = new Liveblocks({secret: process.env.LIVEBLOCKS_SECRET_KEY!});

// Helper: Persistent Guest ID generation via cookies
async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("liveblocks_guest_id")?.value;
  return guestId ?? `guest_${randomUUID()}`;
}

async function getImageUrl(image: string | null) {
  if (!image) return "";
  if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) return image;

  try {
    const cleanKey = image.startsWith("/") ? image.slice(1) : image;
    const bucketName =
      process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME

     
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    });

    return await getSignedUrl(s3, command, { expiresIn: 86400 });
  } catch {
    return image;
  }
}

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

    // Stable User Identification (Fixes "Could not delete comment" and guest ID mismatch)
    const isRegisteredUser = Boolean(sessionData?.user?.id);
    const stableGuestId = await getOrCreateGuestId();

    const userId = sessionData?.user?.id || stableGuestId;
    const userName = sessionData?.user?.name || "Guest User";
    const rawAvatar = sessionData?.user?.image || "";
    const userAvatar = await getImageUrl(rawAvatar);

    // Query Board Access Mode
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { createdById: true, accessMode: true },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    let isEditor: boolean;
    if (sessionData?.user?.id && board.createdById === sessionData.user.id) {
      isEditor = true; // Owner is always Editor
    } else {
      isEditor = board.accessMode === "editor";
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
      session.allow(boardId, ["room:write", "comments:write"]);
    } else {
      session.allow(boardId, ["room:read", "room:presence:write","comments:write","comments:read"]);
    }

    const { body, status } = await session.authorize();

    const response = new NextResponse(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });

    if (!isRegisteredUser) {
      response.cookies.set("liveblocks_guest_id", stableGuestId, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days persistent guest ID
      });
    }

    return response;
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