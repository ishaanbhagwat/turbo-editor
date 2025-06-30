import { cn } from "@/lib/utils"
import { LLMReplacement, LLMInsertion } from "@/lib/types"
import { useState } from "react"

interface ChatMessageProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
  selectedText?: string
  replacements?: LLMReplacement[]
  insertions?: LLMInsertion[]
  usedReplacements?: Set<string>
  usedInsertions?: Set<string>
  onReplacementUsed?: (replacementId: string) => void
  onInsertionUsed?: (insertionId: string) => void
  onRetry?: () => void
}

// Component to display selected text context
function SelectedTextContext({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="mb-3 bg-gray-900 dark:bg-gray-900 border border-gray-800 dark:border-gray-700 rounded-md pt-1 pb-1 pl-2 text-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-gray-300 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-400 font-medium transition-colors"
      >
        {isExpanded ? 'Hide context' : 'Show context'}
      </button>
      {isExpanded && (
        <div className="text-gray-300 dark:text-gray-400 whitespace-pre-wrap leading-relaxed mt-2">
          {text}
        </div>
      )}
    </div>
  )
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  selectedText,
  replacements, 
  insertions,
  usedReplacements, 
  usedInsertions,
  onReplacementUsed, 
  onInsertionUsed,
  onRetry
}: ChatMessageProps) {
  const isUser = role === "user"
  const isSystem = role === "system"

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  // Function to render markdown-like formatting
  const renderFormattedText = (text: string) => {
    // Split by lines to handle bullets and formatting
    const lines = text.split('\n')
    
    return lines.map((line, lineIndex) => {
      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 mb-1">
            <span className="text-gray-400 mt-1">•</span>
            <span className="flex-1">{renderInlineFormatting(line.replace(/^[-•]\s*/, ''))}</span>
          </div>
        )
      }
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.match(/^(\d+)\.\s(.+)/)
        if (match) {
          return (
            <div key={lineIndex} className="flex items-start gap-2 mb-1">
              <span className="text-gray-400 text-sm min-w-[20px]">{match[1]}.</span>
              <span className="flex-1">{renderInlineFormatting(match[2])}</span>
            </div>
          )
        }
      }
      
      // Regular line
      return (
        <div key={lineIndex} className="mb-1">
          {renderInlineFormatting(line)}
        </div>
      )
    })
  }

  // Function to render inline formatting (bold, italic, etc.)
  const renderInlineFormatting = (text: string) => {
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Handle underlined text
    text = text.replace(/__(.*?)__/g, '<u>$1</u>')
    
    // Handle code snippets
    text = text.replace(/`(.*?)`/g, '<code>$1</code>')
    
    // Split by HTML tags and render
    const parts = text.split(/(<[^>]+>.*?<\/[^>]+>)/)
    
    return parts.map((part, index) => {
      if (part.startsWith('<strong>')) {
        return <strong key={index} className="font-semibold">{part.replace(/<\/?strong>/g, '')}</strong>
      }
      if (part.startsWith('<em>')) {
        return <em key={index} className="italic">{part.replace(/<\/?em>/g, '')}</em>
      }
      if (part.startsWith('<u>')) {
        return <u key={index} className="underline">{part.replace(/<\/?u>/g, '')}</u>
      }
      if (part.startsWith('<code>')) {
        return <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{part.replace(/<\/?code>/g, '')}</code>
      }
      return <span key={index}>{part}</span>
    })
  }

  // Function to render content with replacement containers
  const renderContent = () => {
    // Special handling for "Generating..." state
    if (content === "Generating...") {
      return (
        <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-gray-500 dark:text-gray-400">Generating...</span>
          </div>
        </div>
      )
    }
    
    // Special handling for error messages
    if (content.startsWith('❌')) {
      return (
        <div className="text-sm leading-relaxed">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded-md">
            <div className="text-red-800 dark:text-red-200 mb-3">
              {renderFormattedText(content)}
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
              >
                🔄 Retry
              </button>
            )}
          </div>
        </div>
      )
    }
    
    if ((!replacements || replacements.length === 0) && (!insertions || insertions.length === 0) || role !== "assistant") {
      return <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{renderFormattedText(content)}</div>
    }

    return (
      <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {/* Render the main text content - this should be clean without replacement/insertion blocks */}
        <div>{renderFormattedText(content)}</div>
        
        {/* Render replacement containers */}
        {replacements?.map((replacement, index) => {
          const isUsed = usedReplacements?.has(replacement.id)
          const isStreaming = !replacement.text || replacement.text.endsWith('…') || replacement.text.endsWith('...')
          return (
            <div key={`replacement-${replacement.id || index}`} className="my-3">
              <div className={cn(
                "border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-md",
                isUsed && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              )}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  {isUsed ? "✓ Applied" : "Suggested Replacement"}
                </div>
                {replacement.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {replacement.description}
                  </div>
                )}
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5em]">
                  {replacement.text || <span className="italic text-gray-400">Streaming...</span>}
                  {isStreaming && <span className="ml-2 animate-pulse text-xs text-gray-400">⏳</span>}
                </div>
                {!isUsed && onReplacementUsed && !isStreaming && (
                  <button
                    onClick={() => onReplacementUsed(replacement.id)}
                    className="mt-3 text-xs bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
                  >
                    Apply Replacement
                  </button>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Render insertion containers */}
        {insertions?.map((insertion, index) => {
          const isUsed = usedInsertions?.has(insertion.id)
          const isStreaming = !insertion.text || insertion.text.endsWith('…') || insertion.text.endsWith('...')
          return (
            <div key={`insertion-${insertion.id || index}`} className="my-3">
              <div className={cn(
                "border border-gray-200 dark:border-gray-700 p-3 text-sm rounded-md",
                isUsed && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              )}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  {isUsed ? "✓ Inserted" : "Suggested Insertion"}
                </div>
                {insertion.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {insertion.description}
                  </div>
                )}
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5em]">
                  {insertion.text || <span className="italic text-gray-400">Streaming...</span>}
                  {isStreaming && <span className="ml-2 animate-pulse text-xs text-gray-400">⏳</span>}
                </div>
                {!isUsed && onInsertionUsed && !isStreaming && (
                  <button
                    onClick={() => onInsertionUsed(insertion.id)}
                    className="mt-3 text-xs bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
                  >
                    Insert at Cursor
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Don't render system messages in the UI
  if (isSystem) {
    return null
  }

  // For user messages, render in bubble
  if (isUser) {
    return (
      <div className="flex w-full mb-4 justify-end">
        <div className="max-w-[80%] flex flex-col items-end">
          {/* Timestamp above the bubble */}
          <div className="text-[10px] text-gray-400 dark:text-gray-400 mb-1">
            {timestamp ? formatTime(timestamp) : ""}
          </div>
          {/* Message bubble */}
          <div className="rounded-lg px-3 py-2 text-sm bg-black text-white border border-gray-800 relative shadow-sm">
            {selectedText && <SelectedTextContext text={selectedText} />}
            <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
          </div>
        </div>
      </div>
    )
  }

  // For assistant messages, render directly in scrollable area
  return (
    <div className="mb-6">
      <div className="text-xs text-gray-400 mb-2 font-medium">
        {timestamp ? formatTime(timestamp) : ""}
      </div>
      {renderContent()}
    </div>
  )
}