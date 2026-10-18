import { NextRequest } from "next/server"
import { auth } from "./auth"

// Standard error response
export function errorResponse(error: string, status: number) {
  return Response.json({ success: false, error }, { status })
}

// Auth check helper - returns session or error response
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) return { error: errorResponse("Unauthorized", 401) }
  return { session }
}

// Role check helper
export async function requireRole(role: "SHIPPER" | "TRUCKER") {
  const result = await requireAuth()
  if ("error" in result) return result
  if (result.session.user.role !== role) {
    return { error: errorResponse("Forbidden", 403) }
  }
  return result
}

// Safe JSON body parser
export async function parseBody<T>(request: NextRequest, schema: import("zod").ZodSchema<T>) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return { error: errorResponse(parsed.error.flatten().fieldErrors as unknown as string, 400) }
    }
    return { data: parsed.data }
  } catch {
    return { error: errorResponse("Invalid request body", 400) }
  }
}
