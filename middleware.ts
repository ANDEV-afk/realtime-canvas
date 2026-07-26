// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚀 SHARE LINK FIX: Agar user board link visit kar raha hai,
  // toh workspace membership check bypass hone do.
  if (pathname.includes("/board/")) {
    return NextResponse.next();
  }

  // Tumhara baaki workspace verification codey niche rahega...
}