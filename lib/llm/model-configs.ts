// Model-specific configurations for different LLM providers
export interface ModelConfig {
  maxTokensParam: string
  maxTokensValue: number
  temperature?: number
  // Add other model-specific parameters as needed
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

// OpenAI model configurations - Updated with current model names
export const OPENAI_MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Standard GPT models use max_tokens
  "gpt-3.5-turbo": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  "gpt-4o": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  "gpt-4o-mini": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  "gpt-4.1-mini": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  "gpt-4.1-nano": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  "gpt-4-turbo": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  "gpt-4-turbo-preview": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  },
  
  // Default configuration for unknown models
  "default": {
    maxTokensParam: "max_tokens",
    maxTokensValue: 1000,
    temperature: 0.7
  }
}

// Helper function to get model configuration
export function getOpenAIModelConfig(model: string): ModelConfig {
  return OPENAI_MODEL_CONFIGS[model] || OPENAI_MODEL_CONFIGS["default"]
}

// Helper function to check if a model uses max_completion_tokens
export function usesMaxCompletionTokens(model: string): boolean {
  const config = getOpenAIModelConfig(model)
  return config.maxTokensParam === "max_completion_tokens"
}

// Helper function to get the appropriate parameter name for any model
export function getMaxTokensParam(model: string): string {
  const config = getOpenAIModelConfig(model)
  return config.maxTokensParam
} 