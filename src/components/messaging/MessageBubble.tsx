import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  content: string
  senderName: string
  timestamp: string | Date
  isOwn: boolean
}

export function MessageBubble({ content, senderName, timestamp, isOwn }: MessageBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn("flex flex-col max-w-[75%]", isOwn ? "ml-auto items-end" : "mr-auto items-start")}>
      <p className="text-xs text-warm-300 mb-0.5 px-1">{senderName}</p>
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isOwn
            ? "bg-indigo-600 text-white"
            : "bg-white border border-warm-200 text-warm-800"
        )}
      >
        {content}
      </div>
      <p className="text-[10px] text-warm-300 mt-0.5 px-1">{time}</p>
    </div>
  )
}
