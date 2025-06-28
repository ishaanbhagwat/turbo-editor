export type LLMMessage = {
    role: "user" | "assistant" | "system"
    content: string
  }
  
  export class LLMClient {
    private apiUrl: string
    private provider: string
    private apiKey: string
  
    constructor(apiUrl: string, provider: string, apiKey: string) {
      this.apiUrl = apiUrl
      this.provider = provider
      this.apiKey = apiKey
    }
  
    async *streamResponse(messages: LLMMessage[]): AsyncGenerator<string> {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: this.provider,
          messages,
          apiKey: this.apiKey
        })
      })
  
      if (!res.ok || !res.body) throw new Error("Failed to stream from LLM")
  
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let partial = ""
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        partial += decoder.decode(value)
  
        for (const line of partial.split("\n")) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue
          const data = trimmed.slice(5).trim()
          if (data === "[DONE]") return
  
          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content
            if (delta) yield delta
          } catch {}
        }
  
        partial = partial.slice(partial.lastIndexOf("\n") + 1)
      }
    }
  }