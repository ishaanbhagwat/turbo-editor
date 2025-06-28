import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user"
  const isSystem = role === "system"

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  // Don't render system messages in the UI
  if (isSystem) {
    return null
  }

  return (
    <div className={cn("flex w-full mb-2", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-3 text-sm border relative",
          isUser
            ? "bg-primary text-primary-foreground border-primary/20"
            : "bg-muted border-border"
        )}
      >
        <div className="whitespace-pre-wrap pr-8 pb-1">{content}</div>
        <div className="text-[10px] text-muted-foreground absolute bottom-2 right-3">
          {timestamp ? formatTime(timestamp) : ""}
        </div>
      </div>
    </div>
  )
}