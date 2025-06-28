import { Readable } from "stream"

export type LLMMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export interface LLMProvider {
  name: string
  stream(messages: LLMMessage[], apiKey: string): Promise<ReadableStream<Uint8Array>>
}