import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@/lib/test-utils'
import Page from '../page'

// Mock the ChatEditorLayout component
jest.mock('@/components/ChatEditorLayout', () => {
  return function MockChatEditorLayout() {
    return <div data-testid="chat-editor-layout">Chat Editor Layout</div>
  }
})

describe('Page', () => {
  it('renders the ChatEditorLayout component', () => {
    render(<Page />)
    
    expect(screen.getByTestId('chat-editor-layout')).toBeInTheDocument()
  })
}) 