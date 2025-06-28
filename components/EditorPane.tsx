"use client"

import { useState, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "./ThemeToggle"
import { ExportButton } from "./ExportButton"
import { SettingsPane } from "./SettingsPane"

interface EditorPaneProps {
  onTextSelect?: (text: string) => void
}

export default function EditorPane({ onTextSelect }: EditorPaneProps) {
  const [content, setContent] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
  }

  const handleTextareaSelect = () => {
    if (textareaRef.current && onTextSelect) {
      const selection = textareaRef.current.value.substring(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd
      )
      onTextSelect(selection)
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length

  return (
    <div className="flex-1 flex flex-col bg-background relative">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col">
        {/* Header with controls */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Editor</h2>
            <div className="text-sm text-muted-foreground">
              {wordCount} words • {charCount} characters
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Settings"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <ExportButton content={content} />
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-1 p-4">
          <ScrollArea className="h-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onSelect={handleTextareaSelect}
              placeholder="Start writing your masterpiece..."
              className="w-full h-full min-h-[400px] p-4 resize-none border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </ScrollArea>
        </div>
      </div>

      {/* Settings pane overlay */}
      <SettingsPane 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  )
}
