import { LLMReplacement, LLMInsertion } from '@/lib/types'

export function parseLLMResponse(rawContent: string): { response: string; replacements: LLMReplacement[]; insertions: LLMInsertion[] } {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(rawContent.trim())
    
    // Validate the structure
    if (parsed && typeof parsed.response === 'string') {
      return {
        response: parsed.response,
        replacements: Array.isArray(parsed.replacements) ? parsed.replacements.map((r: LLMReplacement) => ({
          ...r,
          type: r.type || 'replacement'
        })) : [],
        insertions: Array.isArray(parsed.insertions) ? parsed.insertions : []
      }
    }
  } catch {
    // Silently continue to fallback parsing
  }
  
  // Try to extract partial JSON content for streaming
  // Look for patterns like {"response": "partial text... and partial replacements/insertions
  const responseMatch = rawContent.match(/"response"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/)
  const partialResponse = responseMatch ? responseMatch[1] : undefined

  // Try to extract partial replacements array - be more aggressive about detecting partial blocks
  const partialReplacements: LLMReplacement[] = []
  
  // First, check if we have a replacements array at all
  if (rawContent.includes('"replacements"')) {
    // Look for individual replacement objects, even if they're incomplete
    const replacementObjects = rawContent.match(/\{[^}]*"id"[^}]*\}/g) || []
    
    replacementObjects.forEach((objStr) => {
      try {
        // Try to parse as complete JSON first
        const parsed = JSON.parse(objStr) as LLMReplacement
        if (parsed.id) {
          partialReplacements.push(parsed)
        }
      } catch {
        // If parsing fails, extract what we can manually
        const idMatch = objStr.match(/"id"\s*:\s*"([^"]*)"/)
        const textMatch = objStr.match(/"text"\s*:\s*"([^"]*)/)
        const descriptionMatch = objStr.match(/"description"\s*:\s*"([^"]*)/)
        const typeMatch = objStr.match(/"type"\s*:\s*"([^"]*)/)
        
        if (idMatch) {
          partialReplacements.push({
            id: idMatch[1],
            text: textMatch ? textMatch[1] : '',
            description: descriptionMatch ? descriptionMatch[1] : '',
            type: (typeMatch ? typeMatch[1] : 'replacement') as 'replacement',
          })
        }
      }
    })
    
    // If we found no complete objects but we see the start of replacements, create a placeholder
    if (partialReplacements.length === 0 && rawContent.includes('"replacements"')) {
      const replacementsStart = rawContent.indexOf('"replacements"')
      const afterReplacements = rawContent.substring(replacementsStart)
      
      // Look for any partial object that might be starting
      if (afterReplacements.includes('{') && afterReplacements.includes('"id"')) {
        // Create a placeholder replacement
        partialReplacements.push({
          id: `placeholder-${Date.now()}`,
          text: '',
          description: '',
          type: 'replacement',
        })
      }
    }
  }

  // Try to extract partial insertions array - be more aggressive about detecting partial blocks
  const partialInsertions: LLMInsertion[] = []
  
  // First, check if we have an insertions array at all
  if (rawContent.includes('"insertions"')) {
    // Look for individual insertion objects, even if they're incomplete
    const insertionObjects = rawContent.match(/\{[^}]*"id"[^}]*\}/g) || []
    
    insertionObjects.forEach((objStr) => {
      try {
        // Try to parse as complete JSON first
        const parsed = JSON.parse(objStr) as LLMInsertion
        if (parsed.id) {
          partialInsertions.push(parsed)
        }
      } catch {
        // If parsing fails, extract what we can manually
        const idMatch = objStr.match(/"id"\s*:\s*"([^"]*)"/)
        const textMatch = objStr.match(/"text"\s*:\s*"([^"]*)/)
        const descriptionMatch = objStr.match(/"description"\s*:\s*"([^"]*)/)
        
        if (idMatch) {
          partialInsertions.push({
            id: idMatch[1],
            text: textMatch ? textMatch[1] : '',
            description: descriptionMatch ? descriptionMatch[1] : '',
          })
        }
      }
    })
    
    // If we found no complete objects but we see the start of insertions, create a placeholder
    if (partialInsertions.length === 0 && rawContent.includes('"insertions"')) {
      const insertionsStart = rawContent.indexOf('"insertions"')
      const afterInsertions = rawContent.substring(insertionsStart)
      
      // Look for any partial object that might be starting
      if (afterInsertions.includes('{') && afterInsertions.includes('"id"')) {
        // Create a placeholder insertion
        partialInsertions.push({
          id: `placeholder-${Date.now()}`,
          text: '',
          description: '',
        })
      }
    }
  }

  if (partialResponse || partialReplacements.length > 0 || partialInsertions.length > 0) {
    return {
      response: partialResponse || '',
      replacements: partialReplacements,
      insertions: partialInsertions
    }
  }
  
  // Also try to extract from incomplete JSON that might be missing closing braces
  const incompleteMatch = rawContent.match(/"response"\s*:\s*"([^"]*(?:\\"[^"]*)*)"\s*,?\s*$/)
  if (incompleteMatch) {
    const partialResponse = incompleteMatch[1]
    if (partialResponse) {
      // Also try to extract replacements and insertions from the incomplete JSON
      let partialReplacements: LLMReplacement[] = []
      let partialInsertions: LLMInsertion[] = []
      
      // Try to extract replacements array
      const replacementsMatch = rawContent.match(/"replacements"\s*:\s*\[([^\]]*)\]/)
      if (replacementsMatch) {
        try {
          const replacementsStr = `[${replacementsMatch[1]}]`
          const parsedReplacements = JSON.parse(replacementsStr) as LLMReplacement[]
          if (Array.isArray(parsedReplacements)) {
            partialReplacements = parsedReplacements.map((r: LLMReplacement) => ({
              ...r,
              type: r.type || 'replacement'
            }))
          }
        } catch {
          // Silently continue to fallback parsing
        }
      }
      
      // Try to extract insertions array
      const insertionsMatch = rawContent.match(/"insertions"\s*:\s*\[([^\]]*)\]/)
      if (insertionsMatch) {
        try {
          const insertionsStr = `[${insertionsMatch[1]}]`
          const parsedInsertions = JSON.parse(insertionsStr) as LLMInsertion[]
          if (Array.isArray(parsedInsertions)) {
            partialInsertions = parsedInsertions
          }
        } catch {
          // Silently continue to fallback parsing
        }
      }
      
      return {
        response: partialResponse,
        replacements: partialReplacements,
        insertions: partialInsertions
      }
    }
  }
  
  // Fallback: try to extract JSON from markdown code blocks
  const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim())
      if (parsed && typeof parsed.response === 'string') {
        return {
          response: parsed.response,
          replacements: Array.isArray(parsed.replacements) ? parsed.replacements.map((r: LLMReplacement) => ({
            ...r,
            type: r.type || 'replacement'
          })) : [],
          insertions: Array.isArray(parsed.insertions) ? parsed.insertions : []
        }
      }
    } catch {
      // Silently continue to fallback parsing
    }
  }
  
  // If no valid JSON found, determine if this was intended to be JSON or simple text
  // Check if the content looks like it was intended to be JSON (starts with { or [)
  const looksLikeJson = rawContent.trim().startsWith('{') || rawContent.trim().startsWith('[')
  
  if (looksLikeJson) {
    // This looks like malformed JSON - return empty to prevent showing raw JSON
    return {
      response: "",
      replacements: [],
      insertions: []
    }
  } else {
    // This looks like simple text - return the raw content
    return {
      response: rawContent,
      replacements: [],
      insertions: []
    }
  }
} 