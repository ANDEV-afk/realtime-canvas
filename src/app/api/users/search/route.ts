import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json([], { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const text = searchParams.get("q") || "";

  const users = await prisma.user.findMany({
    where: {
      name: { contains: text, mode: "insensitive" },
    },
    select: { id: true },
    take: 10,
  });

  // Return array of user IDs string for Liveblocks mention suggestions
  return NextResponse.json(users.map((u) => u.id));
}