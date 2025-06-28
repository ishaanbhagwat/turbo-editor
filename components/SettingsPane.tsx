"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface SettingsPaneProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPane({ isOpen, onClose }: SettingsPaneProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when settings is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Settings pane */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-md border-l shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </div>

          {/* Settings content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Editor Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Editor
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save" className="text-sm">
                    Auto-save
                  </Label>
                  <Switch id="auto-save" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="spell-check" className="text-sm">
                    Spell check
                  </Label>
                  <Switch id="spell-check" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="word-wrap" className="text-sm">
                    Word wrap
                  </Label>
                  <Switch id="word-wrap" defaultChecked />
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                AI Assistant
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm">
                    Default Model
                  </Label>
                  <select
                    id="model"
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                    defaultValue="gpt-3.5-turbo"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="context-aware" className="text-sm">
                    Context-aware responses
                  </Label>
                  <Switch id="context-aware" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-scroll" className="text-sm">
                    Auto-scroll to new messages
                  </Label>
                  <Switch id="auto-scroll" defaultChecked />
                </div>
              </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Export
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="default-format" className="text-sm">
                    Default Export Format
                  </Label>
                  <select
                    id="default-format"
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                    defaultValue="pdf"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">Word Document</option>
                    <option value="txt">Plain Text</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-timestamp" className="text-sm">
                    Include timestamp in filename
                  </Label>
                  <Switch id="include-timestamp" defaultChecked />
                </div>
              </div>
            </div>

            {/* About */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                About
              </h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Turbo Editor v1.0.0</div>
                <div>AI-powered writing assistant</div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Clear API key functionality
                      fetch("/api/clear-key", { method: "POST" })
                        .then(() => window.location.reload())
                        .catch(console.error)
                    }}
                  >
                    Clear API Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 