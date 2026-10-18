import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

// Strict: 5 requests per minute (for auth endpoints)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:auth",
})

// Standard: 30 requests per minute (for API endpoints)
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:api",
})

// Helper to get client IP
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}

// Helper to check rate limit and return 429 if exceeded
export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)
  if (!success) {
    return new Response(JSON.stringify({ success: false, error: "Too many requests" }), {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    })
  }
  return null // No rate limit hit
}
