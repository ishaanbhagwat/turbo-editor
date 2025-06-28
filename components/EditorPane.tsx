"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  const [isSelectionPersistent, setIsSelectionPersistent] = useState(false)
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
        setIsSelectionPersistent(false) // Reset persistent state when new selection is made
        onTextSelect(selection)
      } else {
        setCurrentSelection(null)
        setIsSelectionPersistent(false)
        onTextSelect("")
      }
    }
  }

  const handleTextareaFocus = () => {
    // Restore selection if we have a persistent selection
    if (isSelectionPersistent && currentSelection && textareaRef.current) {
      textareaRef.current.setSelectionRange(currentSelection.start, currentSelection.end)
      setIsSelectionPersistent(false)
    }
  }

  const handleTextareaBlur = () => {
    // Make selection persistent if we have a current selection
    if (currentSelection && textareaRef.current) {
      const currentStart = textareaRef.current.selectionStart
      const currentEnd = textareaRef.current.selectionEnd
      
      // Only make persistent if there's actually a selection
      if (currentStart !== currentEnd) {
        setIsSelectionPersistent(true)
      }
    }
  }

  // Function to replace selected text with new content
  const replaceSelectedText = useCallback((newText: string) => {
    if (!currentSelection || !textareaRef.current) return

    const beforeSelection = content.substring(0, currentSelection.start)
    const afterSelection = content.substring(currentSelection.end)
    const newContent = beforeSelection + newText + afterSelection
    
    // Calculate new selection range for the inserted text
    const newStart = currentSelection.start
    const newEnd = currentSelection.start + newText.length

    setContent(newContent)
    debouncedSave(newContent)
    
    // Set the new selection to the replaced text and make it persistent
    setCurrentSelection({ start: newStart, end: newEnd, text: newText })
    setIsSelectionPersistent(true)
    
    // Focus back to textarea and set selection to the new text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newStart, newEnd)
      }
    }, 100)
  }, [currentSelection, content, debouncedSave])

  // Function to insert text at current cursor position
  const insertTextAtCursor = useCallback((textToInsert: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    
    const beforeCursor = content.substring(0, cursorPosition)
    const afterCursor = content.substring(cursorPosition)
    const newContent = beforeCursor + textToInsert + afterCursor
    
    // Calculate new cursor position after insertion
    const newCursorPosition = cursorPosition + textToInsert.length

    setContent(newContent)
    debouncedSave(newContent)
    
    // Focus back to textarea and set cursor position after the inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 100)
  }, [content, debouncedSave])

  // Expose replaceSelectedText and insertTextAtCursor functions to parent component
  useEffect(() => {
    if (onTextSelect) {
      // Add the replace and insert functions to the window object for global access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).replaceSelectedText = replaceSelectedText
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).insertTextAtCursor = insertTextAtCursor
    }
    
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).replaceSelectedText
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).insertTextAtCursor
    }
  }, [currentSelection, content, onTextSelect, replaceSelectedText, insertTextAtCursor])

  // Update selection styling based on persistent state
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      
      if (isSelectionPersistent) {
        // Gray selection for persistent state
        textarea.style.setProperty('--selection-bg', 'rgb(229 231 235)') // gray-200
        textarea.style.setProperty('--selection-color', 'rgb(55 65 81)') // gray-700
      } else {
        // Blue selection for active state
        textarea.style.setProperty('--selection-bg', 'rgb(59 130 246)') // blue-500
        textarea.style.setProperty('--selection-color', 'rgb(255 255 255)') // white
      }
    }
  }, [isSelectionPersistent])

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
    <div className="flex-1 flex flex-col bg-background relative h-full">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with controls */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b">
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
        <div className="flex-1 p-4 min-h-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onSelect={handleTextareaSelect}
            onMouseUp={handleTextareaSelect}
            onKeyUp={handleTextareaSelect}
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            placeholder="Start writing your masterpiece..."
            className="editor-textarea w-full h-full p-4 resize-none border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 overflow-y-auto"
          />
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
