"use client"

import { useState, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { ExportButton } from "./ExportButton"

interface EditorPaneProps {
  onTextSelection?: (selectedText: string) => void
}

export default function EditorPane({ onTextSelection }: EditorPaneProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0
  const charCount = content.length

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const selectedText = textareaRef.current.value.substring(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd
      )
      onTextSelection?.(selectedText)
    }
  }

  return (
    <div className="w-[70%] p-4 overflow-hidden flex flex-col relative bg-background">
      <div className="flex flex-rows justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="text-foreground font-semibold text-lg">Editor</div>
          <ExportButton content={content} />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
              {wordCount} words • {charCount} characters
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      <ScrollArea className="flex-1 rounded-md border bg-background">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          className={cn(
            "w-full min-h-[calc(100vh-8rem)] resize-none outline-none bg-background text-foreground p-4",
            "font-mono text-sm border-0 focus:ring-0",
            "placeholder:text-muted-foreground"
          )}
          placeholder="Start writing here..."
        />
      </ScrollArea>
    </div>
  )
}
