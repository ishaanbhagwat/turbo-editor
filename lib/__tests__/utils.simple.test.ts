import { getSettings, getModelDisplayName } from '../settings'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Settings Utilities', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
  })

  describe('getSettings', () => {
    it('returns default settings when no settings exist', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const settings = getSettings()
      
      expect(settings).toEqual({
        defaultModel: 'gpt-3.5-turbo',
        autoSave: true,
        spellCheck: true,
        wordWrap: true,
        contextAware: true,
        autoScroll: true,
        defaultExportFormat: 'pdf',
        includeTimestamp: true
      })
    })

    it('returns saved settings from localStorage', () => {
      const savedSettings = {
        defaultModel: 'gpt-4',
        autoSave: false,
        theme: 'dark'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings))
      
      const settings = getSettings()
      
      expect(settings).toEqual({
        ...savedSettings,
        spellCheck: true,
        wordWrap: true,
        contextAware: true,
        autoScroll: true,
        defaultExportFormat: 'pdf',
        includeTimestamp: true
      })
    })

    it('merges default settings with saved settings', () => {
      const savedSettings = {
        defaultModel: 'gpt-4'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings))
      
      const settings = getSettings()
      
      expect(settings).toEqual({
        defaultModel: 'gpt-4',
        autoSave: true,
        spellCheck: true,
        wordWrap: true,
        contextAware: true,
        autoScroll: true,
        defaultExportFormat: 'pdf',
        includeTimestamp: true
      })
    })
  })

  describe('getModelDisplayName', () => {
    it('returns correct display name for gpt-3.5-turbo', () => {
      const displayName = getModelDisplayName('gpt-3.5-turbo')
      expect(displayName).toBe('GPT-3.5 Turbo')
    })

    it('returns correct display name for gpt-4', () => {
      const displayName = getModelDisplayName('gpt-4')
      expect(displayName).toBe('GPT-4')
    })

    it('returns model name for unknown models', () => {
      const displayName = getModelDisplayName('unknown-model')
      expect(displayName).toBe('unknown-model')
    })
  })
}) 