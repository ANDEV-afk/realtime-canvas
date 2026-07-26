import { auth } from "@/lib/auth";
import { Liveblocks } from "@liveblocks/node";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Session safely resolve karo without failing
    const sessionData = await auth.api
      .getSession({ headers: await headers() })
      .catch(() => null);

    // 1. Logged in user hai toh real ID & Details, otherwise Guest Fallback
    const userId =
      sessionData?.user?.id ||
      `guest_${Math.random().toString(36).substring(2, 9)}`;
    
    const userName = sessionData?.user?.name || "Guest User";
    const userAvatar = sessionData?.user?.image || "";

    // 2. Prepare Liveblocks Session
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        color: sessionData?.user ? "#3b82f6" : "#10b981", // User = Blue, Guest = Green
        avatar: userAvatar,
      },
    });

    // 3. Extract room ID from incoming request body
    const bodyText = await request.text();
    const { room } = bodyText ? JSON.parse(bodyText) : { room: null };

    // 4. Grant full room permissions (Standard Liveblocks SDK method)
    if (room) {
      session.allow(room,["*:write"]);
    } else {
      session.allow("*",["*:write"]);
    }

    // 5. Authorize and build signed token
    const { body, status } = await session.authorize();

    return new NextResponse(body, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Liveblocks Auth Exception:", error);
    return NextResponse.json(
      { error: "Internal Auth Error" },
      { status: 500 }
    );
  }
}