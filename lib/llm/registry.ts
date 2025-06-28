import { LLMProvider } from "./providers/base"
import { OpenAIProvider } from "./providers/openai"

const providers: Record<string, LLMProvider> = {
  openai: OpenAIProvider
}

export function getProvider(name: string): LLMProvider {
  const provider = providers[name.toLowerCase()]
  if (!provider) {
    throw new Error(`LLM provider "${name}" not found`)
  }
  return provider
}