import { parseLLMResponse } from '../llm/parser'
import { getModelDisplayName } from '../settings'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as Storage
global.localStorage = localStorageMock

describe('LLM Parser', () => {
  describe('parseLLMResponse', () => {
    it('parses simple text response when no JSON format', () => {
      const response = 'This is a simple response.'
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('This is a simple response.')
      expect(result.replacements).toEqual([])
      expect(result.insertions).toEqual([])
    })

    it('parses JSON response with replacements and insertions', () => {
      const response = JSON.stringify({
        response: 'Here are some suggestions:',
        replacements: [
          {
            id: 'replacement-1',
            text: 'Improved text',
            description: 'Better version',
            type: 'replacement'
          }
        ],
        insertions: [
          {
            id: 'insertion-1',
            text: 'New text to insert',
            description: 'Additional content'
          }
        ]
      })
      
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('Here are some suggestions:')
      expect(result.replacements).toHaveLength(1)
      expect(result.replacements[0]).toEqual({
        id: 'replacement-1',
        text: 'Improved text',
        description: 'Better version',
        type: 'replacement'
      })
      expect(result.insertions).toHaveLength(1)
      expect(result.insertions[0]).toEqual({
        id: 'insertion-1',
        text: 'New text to insert',
        description: 'Additional content'
      })
    })

    it('parses JSON response with only replacements', () => {
      const response = JSON.stringify({
        response: 'Here are some suggestions:',
        replacements: [
          {
            id: 'replacement-1',
            text: 'Improved text',
            description: 'Better version',
            type: 'replacement'
          }
        ]
      })
      
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('Here are some suggestions:')
      expect(result.replacements).toHaveLength(1)
      expect(result.replacements[0]).toEqual({
        id: 'replacement-1',
        text: 'Improved text',
        description: 'Better version',
        type: 'replacement'
      })
      expect(result.insertions).toEqual([])
    })

    it('parses JSON response with only insertions', () => {
      const response = JSON.stringify({
        response: 'Here is new content to add:',
        insertions: [
          {
            id: 'insertion-1',
            text: 'New text to insert',
            description: 'Additional content'
          }
        ]
      })
      
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('Here is new content to add:')
      expect(result.insertions).toHaveLength(1)
      expect(result.insertions[0]).toEqual({
        id: 'insertion-1',
        text: 'New text to insert',
        description: 'Additional content'
      })
      expect(result.replacements).toEqual([])
    })

    it('parses JSON response with no replacements or insertions', () => {
      const response = JSON.stringify({
        response: 'This is a general response with no suggestions.'
      })
      
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('This is a general response with no suggestions.')
      expect(result.replacements).toEqual([])
      expect(result.insertions).toEqual([])
    })

    it('parses JSON from markdown code block', () => {
      const response = 'Here is the response:\n\n```json\n{\n  "response": "Parsed from markdown",\n  "replacements": [],\n  "insertions": []\n}\n```\n\nEnd of message.'
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('Parsed from markdown')
      expect(result.replacements).toEqual([])
      expect(result.insertions).toEqual([])
    })

    it('handles malformed JSON gracefully', () => {
      const response = 'This is not valid JSON: { invalid json }'
      const result = parseLLMResponse(response)
      
      expect(result.response).toBe('This is not valid JSON: { invalid json }')
      expect(result.replacements).toEqual([])
      expect(result.insertions).toEqual([])
    })
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