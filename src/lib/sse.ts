import { redis } from "./redis"

export function createSSEStream() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(c) {
      controller = c
    },
    cancel() {
      controller = null
    },
  })

  const send = (event: string, data: unknown) => {
    if (controller) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      controller.enqueue(encoder.encode(message))
    }
  }

  const close = () => {
    if (controller) {
      controller.close()
      controller = null
    }
  }

  return { stream, send, close }
}

export async function publishEvent(channel: string, event: string, data: unknown) {
  await redis.publish(channel, JSON.stringify({ event, data, timestamp: Date.now() }))
}

export type SSEMessage = {
  event: string
  data: unknown
  timestamp: number
}
