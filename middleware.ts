import { NextResponse } from "next/server";
// Removed unused import

export function middleware() {
  // Do nothing, just pass through all requests
  return NextResponse.next();
}

// Optional: limit middleware to specific routes if needed
export const config = {
  matcher: [],
};
