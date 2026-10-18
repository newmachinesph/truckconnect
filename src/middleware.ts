import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Routes that are publicly accessible without authentication.
 */
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/onboarding",
  "/rate-calculator",
]

/**
 * Check if a pathname matches one of the public paths (exact or prefix with /).
 */
function isPublicRoute(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )
}

/**
 * Protected route prefixes that require authentication and role checks.
 */
const protectedPrefixes = ["/shipper", "/trucker", "/admin", "/messages", "/profile"]

function isProtectedRoute(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}

/**
 * Role required for a given path prefix. Returns null if no specific role is required.
 */
function requiredRole(pathname: string): string | null {
  if (pathname.startsWith("/shipper")) return "SHIPPER"
  if (pathname.startsWith("/trucker")) return "TRUCKER"
  if (pathname.startsWith("/admin")) return "ADMIN"
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Let NextAuth API routes pass through (handled by NextAuth itself)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // For other API routes, return 401 instead of redirecting
  if (pathname.startsWith("/api/")) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Public routes are always accessible
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Protected routes require authentication
  if (isProtectedRoute(pathname)) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If the user has no role yet, redirect to onboarding
    const userRole = session.user.role
    if (!userRole) {
      return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin))
    }

    // Check that the user's role matches the route
    const needed = requiredRole(pathname)
    if (needed && userRole !== needed) {
      // Redirect to the user's own dashboard
      const home = userRole === "ADMIN" ? "/admin" : userRole === "SHIPPER" ? "/shipper" : "/trucker"
      return NextResponse.redirect(new URL(home, req.nextUrl.origin))
    }

    return NextResponse.next()
  }

  // All other routes pass through
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all routes except static assets and Next.js internals.
     * This ensures the middleware runs on pages, API routes, and
     * protected paths while skipping _next/static, _next/image, and
     * common static file extensions.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
