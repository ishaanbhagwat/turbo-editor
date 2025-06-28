export type LLMMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export interface LLMProvider {
  name: string
  stream(messages: LLMMessage[], apiKey: string, model?: string): Promise<ReadableStream<Uint8Array>>
}