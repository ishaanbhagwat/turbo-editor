// Settings store for user preferences
export interface Settings {
  defaultModel: string
  autoSave: boolean
  spellCheck: boolean
  wordWrap: boolean
  contextAware: boolean
  autoScroll: boolean
  defaultExportFormat: string
  includeTimestamp: boolean
}

const DEFAULT_SETTINGS: Settings = {
  defaultModel: "gpt-4.1-nano",
  autoSave: true,
  spellCheck: true,
  wordWrap: true,
  contextAware: true,
  autoScroll: true,
  defaultExportFormat: "pdf",
  includeTimestamp: true
}

const SETTINGS_KEY = "turbo-settings"

export function getSettings(): Settings {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SETTINGS }
    }
    
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.warn("Failed to load settings:", error)
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Partial<Settings>): void {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return
    }
    
    const current = getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Failed to save settings:", error)
  }
}

export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  saveSettings({ [key]: value })
  
  // Dispatch custom event to notify components of settings change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settingsChanged', { 
      detail: { key, value } 
    }))
  }
}

// Model display names
export const MODEL_NAMES: Record<string, string> = {
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  "gpt-4.1-nano": "GPT-4.1 Nano",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4-turbo-preview": "GPT-4 Turbo Preview"
}

export function getModelDisplayName(model: string): string {
  return MODEL_NAMES[model] || model
} 