import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only admin pages need the session — the public site stays fully cacheable.
  matcher: ["/admin", "/admin/:path*"],
};
