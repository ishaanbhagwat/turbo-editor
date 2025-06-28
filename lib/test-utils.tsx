import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/components/ThemeProvider'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data helpers
export const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    usedReplacements: new Set(),
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'I am doing well, thank you for asking!',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    usedReplacements: new Set(),
  },
]

export const mockSettings = {
  defaultModel: 'gpt-3.5-turbo',
  autoSave: true,
  theme: 'system' as const,
}

// Mock API responses
export const mockApiResponses = {
  keyCheck: { exists: true },
  chat: {
    choices: [
      {
        delta: {
          content: 'This is a test response',
        },
      },
    ],
  },
}

// Helper to mock fetch responses
export const mockFetch = (response: unknown, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  })
}

// Helper to mock localStorage
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Helper to create mock event
export const createMockEvent = (type: string, target?: unknown) => ({
  type,
  target,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
})

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)) 