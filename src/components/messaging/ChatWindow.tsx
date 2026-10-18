"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PaperAirplaneIcon } from "@heroicons/react/24/outline"
import { MessageBubble } from "@/components/messaging/MessageBubble"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"

interface Message {
  id: string
  content: string
  senderName: string
  senderId: string
  timestamp: string
}

interface ChatWindowProps {
  bookingId: string
  currentUserId: string
  className?: string
}

export function ChatWindow({ bookingId, currentUserId, className }: ChatWindowProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // Fetch message history
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?bookingId=${bookingId}`)
        const data = await res.json()
        if (data.success) {
          setMessages(data.data)
          setTimeout(scrollToBottom, 50)
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err)
      }
    }

    fetchMessages()
  }, [bookingId, scrollToBottom])

  // Subscribe to SSE for new messages
  useEffect(() => {
    const eventSource = new EventSource(`/api/messages/stream?bookingId=${bookingId}`)

    eventSource.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data)
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        })
        setTimeout(scrollToBottom, 50)
      } catch (err) {
        console.error("Failed to parse message:", err)
      }
    }

    eventSource.onerror = () => {
      console.warn("Chat SSE connection lost, reconnecting...")
    }

    return () => {
      eventSource.close()
    }
  }, [bookingId, scrollToBottom])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    setInput("")

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          content: trimmed,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message")
      }

      // The message will arrive via SSE, but add it optimistically
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.data.id)) return prev
        return [...prev, data.data]
      })
      setTimeout(scrollToBottom, 50)
    } catch (err) {
      toast("error", "Failed to send message")
      setInput(trimmed) // Restore input on failure
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("flex flex-col border border-warm-200 rounded-lg bg-white overflow-hidden", className)}>
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px] bg-surface"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-warm-300 text-center py-8">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              senderName={msg.senderName}
              timestamp={msg.timestamp}
              isOwn={msg.senderId === currentUserId}
            />
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-warm-200 p-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-indigo-600-500 focus:border-transparent"
          disabled={isSending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className={cn(
            "rounded-md p-2 transition-colors",
            input.trim() && !isSending
              ? "bg-indigo-600 text-white hover:bg-indigo-500-700"
              : "bg-warm-100 text-warm-300 cursor-not-allowed"
          )}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
