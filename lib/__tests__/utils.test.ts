import { parseLLMResponse } from '../llm/parser'
import { getModelDisplayName } from '../settings'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

describe('LLM Parser', () => {
  describe('parseLLMResponse', () => {
    it('parses simple text response', () => {
      const response = 'This is a simple response.'
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('This is a simple response.')
      expect(result.replacements).toEqual([])
    })
    // TODO: Add more robust LLM parser tests when implementation is stable
  })
})

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  // TODO: Add getSettings tests when settings structure is finalized

  describe('getModelDisplayName', () => {
    it('returns correct display name for gpt-3.5-turbo', () => {
      const displayName = getModelDisplayName('gpt-3.5-turbo')
      expect(displayName).toBe('GPT-3.5 Turbo')
    })

    it('returns correct display name for gpt-4', () => {
      const displayName = getModelDisplayName('gpt-4')
      expect(displayName).toBe('GPT-4')
    })

    it('returns correct display name for gpt-4-turbo', () => {
      const displayName = getModelDisplayName('gpt-4-turbo')
      expect(displayName).toBe('GPT-4 Turbo')
    })

    it('returns model name for unknown models', () => {
      const displayName = getModelDisplayName('unknown-model')
      expect(displayName).toBe('unknown-model')
    })

    it('handles empty model name', () => {
      const displayName = getModelDisplayName('')
      expect(displayName).toBe('')
    })
  })
}) 