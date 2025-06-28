'use client';
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "./ChatMessage";
import { KeyInput } from "@/components/KeyInput"

interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: Date
  }

interface LLMPaneProps {
  selectedText?: string
}

export default function LLMPane({ selectedText }: LLMPaneProps){
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [hasKey, setHasKey] = useState<boolean | null>(null)
    const [isCheckingKey, setIsCheckingKey] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isClearingKey, setIsClearingKey] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)

    // System message for context
    const systemMessage = {
      role: "system" as const,
      content: `You are Turbo Assistant, a helpful AI writing assistant. You help users with:
- Writing and editing text
- Brainstorming ideas
- Improving writing quality and clarity
- Answering questions about writing
- Providing constructive feedback

Be concise, helpful, and encouraging. You have access to the conversation history to maintain context.`
    }

    useEffect(() => {
      checkApiKey()
    }, [])

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
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !hasKey) return
    
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: input,
          timestamp: new Date()
        }
    
        setMessages(prev => [...prev, userMessage])
        setInput("")
        scrollToBottom()
        setIsLoading(true)
        setError(null)

        await streamLLMResponse(userMessage.content)
      }

      const streamLLMResponse = async (userInput: string) => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          timestamp: new Date()
        }
    
        setMessages(prev => [...prev, assistantMessage])
    
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
              ]
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

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            partial += decoder.decode(value)

            for (const line of partial.split("\n")) {
              const trimmed = line.trim()
              if (!trimmed.startsWith("data:")) continue
              const data = trimmed.slice(5).trim()
              if (data === "[DONE]") return

              try {
                const json = JSON.parse(data)
                const delta = json?.choices?.[0]?.delta?.content
                if (delta) {
                  setMessages(prev =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + delta }
                        : msg
                    )
                  )
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
          setError(err instanceof Error ? err.message : "Failed to get response from AI")
          // Update the assistant message to show error
          setMessages(prev =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: "Sorry, I encountered an error. Please try again." }
                : msg
            )
          )
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
      }

      if (isCheckingKey) {
        return (
          <div className="w-[30%] border-r flex flex-col bg-background">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Checking API key...</div>
            </div>
          </div>
        )
      }

      if (!hasKey) {
        return (
          <div className="w-[30%] border-r flex flex-col bg-background">
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

    return(
        <div className="w-[30%] border-r flex flex-col bg-background">
        {/* Header with clear key button and theme toggle */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-xl">Turbo Assistant</h1>
            {/* {messages.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {Math.min(messages.length, 10)} messages in context
              </div>
            )} */}
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

        {/* Chat area - separately scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground mb-2">
                  Start a conversation with Turbo Assistant
                </div>
                <div className="text-xs text-muted-foreground">
                  I'll remember our conversation context
                </div>
              </div>
            )}
            {messages.map((msg) => (
            <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
            />
            ))}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                {error}
              </div>
            )}
            <div ref={scrollRef} />
        </div>

        {/* Input - fixed at bottom */}
        <div className="border-t p-4">
            <div className="relative">
                {selectedText && selectedText.trim() && (
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
                      handleSubmit(e as any)
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
                      handleSubmit(e as any)
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
                    <span>OpenAI GPT-3.5</span>
                </div>
                <div className="text-xs opacity-60">
                    Press Enter to send
                </div>
            </div>
        </div>
        </div>
    );
}