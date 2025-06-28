import React from 'react'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Mock localStorage
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('renders all three theme toggle buttons', () => {
    render(<ThemeToggle />)
    
    // Should render three buttons: light, dark, and system
    const lightButton = screen.getByRole('button', { name: 'Light mode' })
    const darkButton = screen.getByRole('button', { name: 'Dark mode' })
    const systemButton = screen.getByRole('button', { name: 'System mode' })
    
    expect(lightButton).toBeInTheDocument()
    expect(darkButton).toBeInTheDocument()
    expect(systemButton).toBeInTheDocument()
  })

  it('shows correct icons for each theme mode', () => {
    render(<ThemeToggle />)
    
    // Check that each button has the correct icon
    const lightButton = screen.getByRole('button', { name: 'Light mode' })
    const darkButton = screen.getByRole('button', { name: 'Dark mode' })
    const systemButton = screen.getByRole('button', { name: 'System mode' })
    
    // Light button should have sun icon
    expect(lightButton.querySelector('svg')).toHaveClass('lucide-sun')
    
    // Dark button should have moon icon
    expect(darkButton.querySelector('svg')).toHaveClass('lucide-moon')
    
    // System button should have monitor icon
    expect(systemButton.querySelector('svg')).toHaveClass('lucide-monitor')
  })

  it('handles button clicks', async () => {
    render(<ThemeToggle />)
    
    const lightButton = screen.getByRole('button', { name: 'Light mode' })
    const darkButton = screen.getByRole('button', { name: 'Dark mode' })
    const systemButton = screen.getByRole('button', { name: 'System mode' })
    
    // All buttons should be clickable
    await userEvent.click(lightButton)
    await userEvent.click(darkButton)
    await userEvent.click(systemButton)
    
    // No errors should occur
    expect(lightButton).toBeInTheDocument()
    expect(darkButton).toBeInTheDocument()
    expect(systemButton).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<ThemeToggle />)
    
    const lightButton = screen.getByRole('button', { name: 'Light mode' })
    const darkButton = screen.getByRole('button', { name: 'Dark mode' })
    const systemButton = screen.getByRole('button', { name: 'System mode' })
    
    // Each button should have a title attribute
    expect(lightButton).toHaveAttribute('title', 'Light mode')
    expect(darkButton).toHaveAttribute('title', 'Dark mode')
    expect(systemButton).toHaveAttribute('title', 'System mode')
  })
}) 