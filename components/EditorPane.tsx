"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ExportButton } from "@/components/ExportButton"
import { SettingsPane } from "@/components/SettingsPane"

interface EditorPaneProps {
  onTextSelect?: (text: string) => void
}

const AUTOSAVE_KEY = "turbo-editor-content"
const AUTOSAVE_DELAY = 1000 // 1 second delay

export default function EditorPane({ onTextSelect }: EditorPaneProps) {
  const [content, setContent] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentSelection, setCurrentSelection] = useState<{ start: number; end: number; text: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Load content from localStorage on mount
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(AUTOSAVE_KEY)
      if (savedContent) {
        setContent(savedContent)
      }
    } catch (error) {
      console.warn("Failed to load saved content:", error)
    }
  }, [])

  // Autosave function
  const saveContent = (contentToSave: string) => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, contentToSave)
      setIsSaving(false)
    } catch (error) {
      console.error("Failed to save content:", error)
      setIsSaving(false)
    }
  }

  // Debounced autosave
  const debouncedSave = useCallback((contentToSave: string) => {
    setIsSaving(true)
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(contentToSave)
    }, AUTOSAVE_DELAY)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Trigger autosave
    debouncedSave(newContent)
  }

  const handleTextareaSelect = () => {
    if (textareaRef.current && onTextSelect) {
      const selection = textareaRef.current.value.substring(
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd
      )
      
      if (selection.trim()) {
        const selectionRange = {
          start: textareaRef.current.selectionStart,
          end: textareaRef.current.selectionEnd,
          text: selection
        }
        setCurrentSelection(selectionRange)
        onTextSelect(selection)
      } else {
        setCurrentSelection(null)
        onTextSelect("")
      }
    }
  }

  // Function to replace selected text with new content
  const replaceSelectedText = useCallback((newText: string) => {
    if (!currentSelection || !textareaRef.current) return

    const beforeSelection = content.substring(0, currentSelection.start)
    const afterSelection = content.substring(currentSelection.end)
    const newContent = beforeSelection + newText + afterSelection
    
    setContent(newContent)
    debouncedSave(newContent)
    
    // Clear the selection after replacement
    setCurrentSelection(null)
    
    // Focus back to textarea and set cursor position after the replaced text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursorPosition = currentSelection.start + newText.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 100)
  }, [currentSelection, content, debouncedSave])

  // Expose replaceSelectedText function to parent component
  useEffect(() => {
    if (onTextSelect) {
      // Add the replace function to the window object for global access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).replaceSelectedText = replaceSelectedText
    }
    
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).replaceSelectedText
    }
  }, [currentSelection, content, onTextSelect, replaceSelectedText])

  // Clear saved content (for settings or manual clear)
  const clearSavedContent = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY)
      setContent("")
      setCurrentSelection(null)
    } catch (error) {
      console.error("Failed to clear saved content:", error)
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
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Editor</h2>
            <div className="hidden md:block text-sm text-muted-foreground">
              {wordCount} words • {charCount} characters
            </div>
            {isSaving && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Saving...</span>
              </div>
            )}
            {currentSelection && (
              <div className="text-xs text-muted-foreground">
                {currentSelection.text.length} chars selected
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
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
              onMouseUp={handleTextareaSelect}
              onKeyUp={handleTextareaSelect}
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
        onClearContent={clearSavedContent}
      />
    </div>
  )
}
