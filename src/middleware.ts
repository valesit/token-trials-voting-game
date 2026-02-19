import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get("admin_token")?.value;
  const expectedToken = process.env.ADMIN_TOKEN;

  const isAuthed = adminToken && expectedToken && adminToken === expectedToken;

  if (pathname.startsWith("/host/dashboard")) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/host", request.url));
    }
  }

  if (
    pathname.startsWith("/api/sessions") ||
    pathname.startsWith("/api/participants")
  ) {
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/host/dashboard/:path*",
    "/api/sessions/:path*",
    "/api/participants/:path*",
  ],
};
