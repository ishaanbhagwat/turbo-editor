'use client';
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "./ChatMessage";
import { KeyInput } from "@/components/KeyInput"
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/prompts/system"
import { getSettings, getModelDisplayName } from "@/lib/settings"
import { parseLLMResponse } from "@/lib/llm/parser"
import { LLMReplacement, LLMInsertion } from "@/lib/types"

interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: Date
    replacements?: LLMReplacement[]
    insertions?: LLMInsertion[]
    usedReplacements?: Set<string> // Track which replacements have been used
    usedInsertions?: Set<string> // Track which insertions have been used
  }

interface LLMPaneProps {
  selectedText?: string
}

const CHAT_HISTORY_KEY = "turbo-chat-history"
const CHAT_AUTOSAVE_DELAY = 500 // 500ms delay for chat

export default function LLMPane({ selectedText }: LLMPaneProps){
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [hasKey, setHasKey] = useState<boolean | null>(null)
    const [isCheckingKey, setIsCheckingKey] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isClearingKey, setIsClearingKey] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showSelectedTextContext, setShowSelectedTextContext] = useState(false)
    const [currentModel, setCurrentModel] = useState("gpt-3.5-turbo") // Default fallback
    const [isApiKeyInvalid, setIsApiKeyInvalid] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // System message for context
    const systemMessage = {
      role: "system" as const,
      content: DEFAULT_SYSTEM_PROMPT
    }

    // Load chat history from localStorage on mount
    useEffect(() => {
      try {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY)
        if (savedHistory) {
          const parsedMessages = JSON.parse(savedHistory)
          // Convert timestamp strings back to Date objects and filter out system messages
          const messagesWithDates = parsedMessages
            .filter((msg: { role: string }) => msg.role !== "system")
            .map((msg: { role: string; content: string; timestamp: string; id: string; usedReplacements?: string[]; usedInsertions?: string[] }) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              usedReplacements: msg.usedReplacements ? new Set(msg.usedReplacements) : new Set(),
              usedInsertions: msg.usedInsertions ? new Set(msg.usedInsertions) : new Set()
            }))
          setMessages(messagesWithDates)
        }
      } catch (error) {
        console.warn("Failed to load chat history:", error)
      }
    }, [])

    // Autosave function for chat messages
    const saveChatHistory = (messagesToSave: Message[]) => {
      try {
        // Filter out system messages before saving
        const messagesToSaveFiltered = messagesToSave.filter(msg => msg.role !== "system")
        // Convert Set objects to arrays for JSON serialization
        const serializedMessages = messagesToSaveFiltered.map(msg => ({
          ...msg,
          usedReplacements: msg.usedReplacements ? Array.from(msg.usedReplacements) : [],
          usedInsertions: msg.usedInsertions ? Array.from(msg.usedInsertions) : []
        }))
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(serializedMessages))
        setIsSaving(false)
      } catch (error) {
        console.error("Failed to save chat history:", error)
        setIsSaving(false)
      }
    }

    // Debounced autosave for chat
    const debouncedSaveChat = (messagesToSave: Message[]) => {
      setIsSaving(true)
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveChatHistory(messagesToSave)
      }, CHAT_AUTOSAVE_DELAY)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
      }
    }, [])

    useEffect(() => {
      checkApiKey()
    }, [])

    // Load settings after component mounts
    useEffect(() => {
      const settings = getSettings()
      setCurrentModel(settings.defaultModel)
    }, [])

    // Listen for settings changes
    useEffect(() => {
      const handleSettingsChange = (event: CustomEvent) => {
        if (event.detail.key === 'defaultModel') {
          setCurrentModel(event.detail.value)
        }
      }

      window.addEventListener('settingsChanged', handleSettingsChange as EventListener)
      
      return () => {
        window.removeEventListener('settingsChanged', handleSettingsChange as EventListener)
      }
    }, [])

    // Show selected text context when selectedText changes
    useEffect(() => {
      if (selectedText && selectedText.trim()) {
        setShowSelectedTextContext(true)
      }
    }, [selectedText])

    const checkApiKey = async () => {
      try {
        setIsCheckingKey(true)
        setError(null)
        const res = await fetch("/api/key-check")
        if (!res.ok) {
          throw new Error("Failed to check API key")
        }
        const data = await res.json()
        setHasKey(data.exists)
      } catch (err) {
        console.error("Error checking API key:", err)
        setError("Failed to check API key status")
        setHasKey(false)
      } finally {
        setIsCheckingKey(false)
      }
    }

    const handleClearKey = async () => {
      try {
        setIsClearingKey(true)
        setError(null)
        
        const res = await fetch("/api/clear-key", {
          method: "POST"
        })

        if (!res.ok) {
          throw new Error("Failed to clear API key")
        }

        setHasKey(false)
        setMessages([])
        // Clear saved chat history
        localStorage.removeItem(CHAT_HISTORY_KEY)
      } catch (err) {
        console.error("Error clearing API key:", err)
        setError("Failed to clear API key")
      } finally {
        setIsClearingKey(false)
      }
    }

    const handleNewConversation = () => {
      setMessages([])
      setError(null)
      // Clear saved chat history
      localStorage.removeItem(CHAT_HISTORY_KEY)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !hasKey) return
    
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: input,
          timestamp: new Date(Date.now()),
          usedReplacements: new Set(),
          usedInsertions: new Set()
        }
    
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInput("")
        setShowSelectedTextContext(false) // Clear the context display after sending
        scrollToBottom()
        setIsLoading(true)
        setError(null)

        // Trigger autosave for the new message
        debouncedSaveChat(newMessages)

        await streamLLMResponse(userMessage.content)
      }

      const streamLLMResponse = async (userInput: string) => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Generating...",
          timestamp: new Date(Date.now()),
          usedReplacements: new Set(),
          usedInsertions: new Set()
        }
    
        setMessages(prev => {
          const newMessages = [...prev, assistantMessage]
          return newMessages
        })
    
        // Build conversation history with system message and recent messages
        const conversationHistory = [
          systemMessage,
          ...messages.slice(-10).map((m) => ({ // Keep last 10 messages for context
            role: m.role,
            content: m.content
          })),
          { role: "user" as const, content: userInput }
        ]

        // Add selected text as context if available
        let finalUserMessage = userInput
        if (selectedText && selectedText.trim()) {
          finalUserMessage = `Selected text from editor:\n"""\n${selectedText}\n"""\n\nUser question: ${userInput}`
        }
    
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "openai",
              messages: [
                ...conversationHistory.slice(0, -1), // Remove the last user message
                { role: "user" as const, content: finalUserMessage }
              ],
              model: currentModel
            })
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `API request failed: ${res.status} ${res.statusText}`)
          }

          if (!res.body) {
            throw new Error("No response body")
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let partial = ""
          let rawJsonResponse = ""
          let hasStartedStreaming = false
          let lastParsedResponse = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            partial += decoder.decode(value)

            for (const line of partial.split("\n")) {
              const trimmed = line.trim()
              if (!trimmed.startsWith("data:")) continue
              const data = trimmed.slice(5).trim()
              if (data === "[DONE]") {
                // Final parsing to extract structured data
                try {
                  const finalParsed = parseLLMResponse(rawJsonResponse)
                  if (finalParsed.response && finalParsed.response !== rawJsonResponse) {
                    // Successfully parsed final JSON
                    setMessages(prev => {
                      const finalMessages = prev.map((msg) => {
                        if (msg.id === assistantMessage.id) {
                          return { 
                            ...msg, 
                            content: finalParsed.response,
                            replacements: finalParsed.replacements,
                            insertions: finalParsed.insertions
                          }
                        }
                        return msg
                      })
                      debouncedSaveChat(finalMessages)
                      return finalMessages
                    })
                  } else {
                    // JSON was incomplete - show error state
                    setMessages(prev => {
                      const errorMessages = prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: "❌ LLM response was incomplete. Please try regenerating the response." }
                          : msg
                      )
                      debouncedSaveChat(errorMessages)
                      return errorMessages
                    })
                  }
                } catch {
                  // Final parsing failed - show error state
                  setMessages(prev => {
                    const errorMessages = prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: "❌ LLM response was malformed. Please try regenerating the response." }
                        : msg
                    )
                    debouncedSaveChat(errorMessages)
                    return errorMessages
                  })
                }
                return
              }

              try {
                const json = JSON.parse(data)
                const delta = json?.choices?.[0]?.delta?.content
                if (delta) {
                  // Accumulate the raw JSON response
                  rawJsonResponse += delta
                  
                  // Try to parse the accumulated JSON to extract text chunks
                  try {
                    const parsed = parseLLMResponse(rawJsonResponse)
                    if (parsed.response && parsed.response !== "Generating..." && parsed.response !== rawJsonResponse && parsed.response.trim() !== "") {
                      // We have valid parsed text - stream it immediately
                      if (!hasStartedStreaming) {
                        hasStartedStreaming = true
                        console.log("Starting to stream parsed content")
                      }
                      
                      // Only update if we have new content to show
                      if (parsed.response !== lastParsedResponse) {
                        console.log("Streaming new content:", parsed.response.substring(lastParsedResponse.length, lastParsedResponse.length + 50) + "...")
                        setMessages(prev => {
                          const updatedMessages = prev.map((msg) =>
                            msg.id === assistantMessage.id
                              ? { 
                                  ...msg, 
                                  content: parsed.response,
                                  replacements: parsed.replacements,
                                  insertions: parsed.insertions
                                }
                              : msg
                          )
                          return updatedMessages
                        })
                        lastParsedResponse = parsed.response
                      }
                    } else if (parsed.replacements.length > 0 || parsed.insertions.length > 0) {
                      // We have structured data even if no response text yet
                      console.log("Detected structured data:", {
                        replacements: parsed.replacements.length,
                        insertions: parsed.insertions.length
                      })
                      setMessages(prev => {
                        const updatedMessages = prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { 
                                ...msg, 
                                content: parsed.response || msg.content,
                                replacements: parsed.replacements,
                                insertions: parsed.insertions
                              }
                            : msg
                        )
                        return updatedMessages
                      })
                    }
                  } catch {
                    // Parsing failed - keep accumulating JSON
                    console.log("Parsing failed, continuing to accumulate JSON")
                  }
                  
                  scrollToBottom()
                }
              } catch (parseError) {
                console.warn("Failed to parse SSE data:", parseError)
              }
            }

            partial = partial.slice(partial.lastIndexOf("\n") + 1)
          }
        } catch (err) {
          console.error("LLM error:", err)
          const errorMessage = err instanceof Error ? err.message : "Failed to get response from AI"
          setError(errorMessage)
          
          // Check if this is an API key error
          if (errorMessage.includes("Invalid API key") || errorMessage.includes("401")) {
            setIsApiKeyInvalid(true)
            setHasKey(false) // Mark as no valid key
          }
          
          // Update the assistant message to show error
          setMessages(prev => {
            const errorMessages = prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: "Sorry, I encountered an error. Please try again." }
                : msg
            )
            // Save even error messages
            debouncedSaveChat(errorMessages)
            return errorMessages
          })
        } finally {
          setIsLoading(false)
        }
      }
    
      const scrollToBottom = () => {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ 
              behavior: "smooth",
              block: "end"
            })
          }
        }, 100)
      }

      const handleKeySaved = () => {
        setHasKey(true)
        setError(null)
        setIsApiKeyInvalid(false)
      }

      if (isCheckingKey) {
        return (
          <div className="w-full md:w-[30%] md:border-r flex flex-col bg-background">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Checking API key...</div>
            </div>
          </div>
        )
      }

      if (!hasKey) {
        return (
          <div className="w-full md:w-[30%] md:border-r flex flex-col bg-background">
            <div className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Setup Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please enter your OpenAI API key to start chatting with the AI assistant.
                  </p>
                </div>
                <KeyInput onKeySaved={handleKeySaved} />
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      if (isApiKeyInvalid) {
        return (
          <div className="w-full md:w-[30%] md:border-r flex flex-col bg-background">
            <div className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">API Key Invalid</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your OpenAI API key has become invalid or expired. Please enter a new valid API key to continue.
                  </p>
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                    <div className="font-medium mb-1">⚠️ API Key Error</div>
                    <div>Your previous API key is no longer valid. This could be due to:</div>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Key expiration or revocation</li>
                      <li>Incorrect key format</li>
                      <li>Account suspension or billing issues</li>
                    </ul>
                  </div>
                </div>
                <KeyInput onKeySaved={handleKeySaved} />
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

    return(
        <div className="w-full md:w-[30%] md:border-r flex flex-col bg-background h-full">
        {/* Header with clear key button and theme toggle */}
        <div className="flex-shrink-0 p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-xl">Turbo Editor</h1>
            {isSaving && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewConversation}
              disabled={messages.length === 0}
            >
              New Chat
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearKey}
              disabled={isClearingKey}
            >
              {isClearingKey ? "Clearing..." : "Clear Key"}
            </Button>
          </div>
        </div>

        {/* Chat area - takes remaining space but doesn't overflow */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground mb-2">
                  Start a conversation with Turbo Assistant
                </div>
                <div className="text-xs text-muted-foreground">
                  I&apos;ll remember our conversation context
                </div>
              </div>
            )}
            {messages.map((msg, index) => {
              console.log(`Processing message ${index}:`, msg.id)
              
              const handleReplacementUsed = (replacementId: string) => {
                // Find the replacement text
                const replacement = msg.replacements?.find(r => r.id === replacementId)
                if (replacement && typeof window !== 'undefined' && 'replaceSelectedText' in window) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (window as any).replaceSelectedText(replacement.text)
                  
                  // Mark this replacement as used and save immediately
                  setMessages(prev => {
                    const updatedMessages = prev.map(message => 
                      message.id === msg.id 
                        ? { 
                            ...message, 
                            usedReplacements: new Set([...(message.usedReplacements || []), replacementId])
                          }
                        : message
                    )
                    // Save immediately after updating
                    debouncedSaveChat(updatedMessages)
                    return updatedMessages
                  })
                }
              }
              
              const handleInsertionUsed = (insertionId: string) => {
                console.log('handleInsertionUsed called with insertionId:', insertionId)
                // Find the insertion text
                const insertion = msg.insertions?.find(i => i.id === insertionId)
                console.log('Found insertion:', insertion)
                if (insertion && typeof window !== 'undefined' && 'insertTextAtCursor' in window) {
                  console.log('Calling insertTextAtCursor with text:', insertion.text)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const insertFunction = (window as any).insertTextAtCursor
                  if (typeof insertFunction === 'function') {
                    insertFunction(insertion.text)
                  }
                  
                  // Mark this insertion as used and save immediately
                  setMessages(prev => {
                    const updatedMessages = prev.map(message => 
                      message.id === msg.id 
                        ? { 
                            ...message, 
                            usedInsertions: new Set([...(message.usedInsertions || []), insertionId])
                          }
                        : message
                    )
                    // Save immediately after updating
                    debouncedSaveChat(updatedMessages)
                    return updatedMessages
                  })
                } else {
                  console.error('insertTextAtCursor function not found on window object')
                }
              }
              
              return (
                <div key={msg.id}>
                  <ChatMessage
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    replacements={msg.replacements}
                    insertions={msg.insertions}
                    usedReplacements={msg.usedReplacements}
                    usedInsertions={msg.usedInsertions}
                    onReplacementUsed={handleReplacementUsed}
                    onInsertionUsed={handleInsertionUsed}
                  />
                </div>
              )
            })}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                {error}
              </div>
            )}
            <div ref={scrollRef} />
        </div>

        {/* Input - fixed at bottom, always visible */}
        <div className="flex-shrink-0 border-t p-4 bg-background">
            <div className="relative">
                {showSelectedTextContext && selectedText && selectedText.trim() && (
                  <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                    <div className="font-medium mb-1">📄 Selected text will be included as context</div>
                    <div className="truncate">{selectedText.length > 100 ? `${selectedText.substring(0, 100)}...` : selectedText}</div>
                  </div>
                )}
                <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (input.trim() && hasKey && !isLoading) {
                      handleSubmit(e as React.FormEvent)
                    }
                  }
                }}
                placeholder="Turbocharge your writing..."
                className="resize-none min-h-[60px] max-h-[120px] pr-12"
                disabled={isLoading}
                />
                
                {/* Floating send button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (input.trim() && hasKey && !isLoading) {
                      handleSubmit(e as React.FormEvent)
                    }
                  }}
                  disabled={!input.trim() || !hasKey || isLoading}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  title="Send message"
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
            </div>
            
            {/* Bottom bar */}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>OpenAI {getModelDisplayName(currentModel)}</span>
                </div>
                <div className="text-xs opacity-60">
                    Press Enter to send
                </div>
            </div>
        </div>
        </div>
    );
}