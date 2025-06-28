// Types for structured LLM responses
export interface LLMReplacement {
  id: string
  text: string
  description: string
  type: 'replacement' | 'insertion'
}

export interface LLMInsertion {
  id: string
  text: string
  description: string
}

export interface LLMResponse {
  response: string
  replacements: LLMReplacement[]
  insertions?: LLMInsertion[]
  metadata?: {
    model?: string
    timestamp?: string
  }
} 