import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get("liveblocks_guest_id")) {
    response.cookies.set("liveblocks_guest_id", `guest_${crypto.randomUUID()}`, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};