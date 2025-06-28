import { cn } from "@/lib/utils"
import { LLMReplacement } from "@/lib/types"

interface ChatMessageProps {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
  replacements?: LLMReplacement[]
  usedReplacements?: Set<string>
  onReplacementUsed?: (replacementId: string) => void
}

export function ChatMessage({ role, content, timestamp, replacements, usedReplacements, onReplacementUsed }: ChatMessageProps) {
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
    console.log('ChatMessage renderContent - role:', role, 'replacements:', replacements)
    console.log('ChatMessage - content:', content)
    
    if (!replacements || replacements.length === 0 || role !== "assistant") {
      console.log('No replacements or not assistant, rendering plain text')
      return <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{renderFormattedText(content)}</div>
    }

    console.log('Processing replacements for assistant message')

  return (
      <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {/* Render the main text content - this should be clean without replacement blocks */}
        <div>{renderFormattedText(content)}</div>
        
        {/* Render replacement containers */}
        {replacements.map((replacement, index) => {
          const isUsed = usedReplacements?.has(replacement.id)
          console.log('Rendering replacement container:', replacement.text, 'isUsed:', isUsed)
          return (
            <div key={index} className="my-3">
              <div className={cn(
                "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm",
                isUsed && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
              )}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  {isUsed ? "✓ Applied" : "Suggested Replacement"}
                </div>
                {replacement.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {replacement.description}
                  </div>
                )}
                <div className="text-gray-800 dark:text-gray-200 font-mono text-sm leading-relaxed whitespace-pre-wrap">{replacement.text}</div>
                {!isUsed && onReplacementUsed && (
                  <button
                    onClick={() => onReplacementUsed(replacement.id)}
                    className="mt-3 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
                  >
                    Apply Replacement
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