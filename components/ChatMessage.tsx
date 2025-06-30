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
  const lines = text.split('\n')
  const shouldTruncate = lines.length > 1 || text.length > 100
  
  // Show only first line or first 100 characters when collapsed
  const displayText = isExpanded ? text : (lines.length > 1 ? lines[0] : text.substring(0, 100))
  const remainingLines = lines.length - 1
  const remainingChars = text.length - 100

  return (
    <div className="mb-3">
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 text-sm">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
          Selected text context:
        </div>
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {displayText}
          {shouldTruncate && !isExpanded && (
            <span className="text-gray-400">...</span>
          )}
        </div>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>
              {isExpanded 
                ? 'Show less' 
                : lines.length > 1 
                  ? `Show ${remainingLines} more line${remainingLines > 1 ? 's' : ''}`
                  : `Show ${remainingChars} more characters`
              }
            </span>
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
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
                // Replacement: yellow theme
                "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 text-sm",
                isUsed && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              )}>
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-2 font-medium">
                  {isUsed ? "✓ Applied" : "Suggested Replacement"}
                </div>
                {replacement.description && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                    {replacement.description}
                  </div>
                )}
                <div className="text-yellow-800 dark:text-yellow-200 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5em]">
                  {replacement.text || <span className="italic text-gray-400">Streaming...</span>}
                  {isStreaming && <span className="ml-2 animate-pulse text-xs text-gray-400">⏳</span>}
                </div>
                {!isUsed && onReplacementUsed && !isStreaming && (
                  <button
                    onClick={() => onReplacementUsed(replacement.id)}
                    className="mt-3 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
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
                // Insertion: blue theme
                "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 text-sm",
                isUsed && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              )}>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
                  {isUsed ? "✓ Inserted" : "Suggested Insertion"}
                </div>
                {insertion.description && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    {insertion.description}
                  </div>
                )}
                <div className="text-blue-800 dark:text-blue-200 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[1.5em]">
                  {insertion.text || <span className="italic text-gray-400">Streaming...</span>}
                  {isStreaming && <span className="ml-2 animate-pulse text-xs text-gray-400">⏳</span>}
                </div>
                {!isUsed && onInsertionUsed && !isStreaming && (
                  <button
                    onClick={() => onInsertionUsed(insertion.id)}
                    className="mt-3 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
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
        <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-gray-800 dark:bg-gray-700 text-gray-100 dark:text-gray-100 border border-gray-700 dark:border-gray-600 relative shadow-sm">
          {selectedText && <SelectedTextContext text={selectedText} />}
          <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-400 ml-2 mt-1 self-end">
          {timestamp ? formatTime(timestamp) : ""}
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