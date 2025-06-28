// Types for structured LLM responses
export interface LLMReplacement {
  id: string
  text: string
  description: string
}

export interface LLMResponse {
  response: string
  replacements: LLMReplacement[]
  metadata?: {
    model?: string
    timestamp?: string
  }
}

// Fallback response structure for backward compatibility
export interface FallbackResponse {
  content: string
  replacements: Array<{ id: string; text: string; startIndex: number }>
} 