import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`)
      )

      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Poll Redis for events on the "loads" channel
      // Upstash Redis REST doesn't support native pub/sub subscriptions,
      // so we use a list-based approach for SSE streaming
      const pollInterval = setInterval(async () => {
        try {
          const message = await redis.lpop<string>("sse:loads")
          if (message) {
            const parsed = typeof message === "string" ? JSON.parse(message) : message
            controller.enqueue(
              encoder.encode(
                `event: ${parsed.event}\ndata: ${JSON.stringify(parsed.data)}\n\n`
              )
            )
          }
        } catch {
          // Silently handle poll errors
        }
      }, 2000)

      // Clean up on close
      const cleanup = () => {
        clearInterval(heartbeat)
        clearInterval(pollInterval)
      }

      // Store cleanup for cancel
      ;(controller as unknown as Record<string, () => void>).__cleanup = cleanup
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, () => void>).__cleanup
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
