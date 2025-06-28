import { LLMReplacement, FallbackResponse } from '@/lib/types'

export function parseLLMResponse(rawContent: string): { response: string; replacements: LLMReplacement[] } {
  console.log('Parsing LLM response:', rawContent)
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(rawContent.trim())
    
    // Validate the structure
    if (parsed && typeof parsed.response === 'string') {
      console.log('Successfully parsed JSON response')
      return {
        response: parsed.response,
        replacements: Array.isArray(parsed.replacements) ? parsed.replacements : []
      }
    }
  } catch (error) {
    console.log('Failed to parse as JSON, trying fallback parsing:', error)
  }
  
  // Fallback: try to extract JSON from markdown code blocks
  const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim())
      if (parsed && typeof parsed.response === 'string') {
        console.log('Successfully parsed JSON from markdown block')
        return {
          response: parsed.response,
          replacements: Array.isArray(parsed.replacements) ? parsed.replacements : []
        }
      }
    } catch (error) {
      console.log('Failed to parse JSON from markdown block:', error)
    }
  }
  
  // Final fallback: treat as plain text with legacy replacement parsing
  console.log('Using fallback parsing for legacy format')
  const fallback = parseLegacyResponse(rawContent)
  return {
    response: fallback.content,
    replacements: fallback.replacements.map(r => ({
      id: r.id,
      text: r.text,
      description: 'Text replacement suggestion'
    }))
  }
}

function parseLegacyResponse(content: string): FallbackResponse {
  const replacements: Array<{ id: string; text: string; startIndex: number }> = []
  
  // Legacy patterns for backward compatibility
  const patterns = [
    /```replacement\n([\s\S]*?)\n```/g,
    /-replacement\n`([\s\S]*?)`\n/g,
    /```replacement\s*\n([\s\S]*?)```/g,
    /-replacement\n`([\s\S]*?)`\n•/g
  ]
  
  let match
  let displayText = content
  
  for (const pattern of patterns) {
    while ((match = pattern.exec(content)) !== null) {
      const replacementText = match[1].trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^`|`$/g, '')
        .trim()
      
      if (replacementText) {
        const replacementId = `legacy-${match.index}-${replacementText.length}`
        replacements.push({
          id: replacementId,
          text: replacementText,
          startIndex: match.index
        })
      }
    }
  }
  
  // Remove replacement blocks from display text
  if (replacements.length > 0) {
    const blocksToRemove: Array<{ start: number; end: number }> = []
    
    for (const replacement of replacements) {
      const patterns = [
        /```replacement\n[\s\S]*?\n```/g,
        /-replacement\n`[\s\S]*?`\n/g,
        /```replacement\s*\n[\s\S]*?```/g,
        /-replacement\n`[\s\S]*?`\n•/g
      ]
      
      for (const pattern of patterns) {
        pattern.lastIndex = 0
        const match = pattern.exec(content)
        if (match && match.index === replacement.startIndex) {
          blocksToRemove.push({
            start: match.index,
            end: match.index + match[0].length
          })
          break
        }
      }
    }
    
    blocksToRemove.sort((a, b) => b.start - a.start)
    
    let cleanContent = content
    for (const block of blocksToRemove) {
      cleanContent = cleanContent.substring(0, block.start) + cleanContent.substring(block.end)
    }
    
    displayText = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  }
  
  return {
    content: displayText,
    replacements
  }
} 