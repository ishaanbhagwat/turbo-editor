import { LLMProvider, LLMMessage } from "./base"

export const OpenAIProvider: LLMProvider = {
  name: "openai",

  async stream(messages: LLMMessage[], apiKey: string, model: string = "gpt-3.5-turbo") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        let errorMessage = `OpenAI API failed: ${res.status} ${res.statusText}`
        
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error?.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`
          }
        } catch {
          // If we can't parse the error, use the raw text
          if (errorText) {
            errorMessage = `OpenAI API error: ${errorText}`
          }
        }

        // Handle specific error cases
        if (res.status === 401) {
          throw new Error("Invalid API key. Please check your OpenAI API key.")
        } else if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.")
        } else if (res.status === 500) {
          throw new Error("OpenAI service is temporarily unavailable. Please try again.")
        } else if (res.status === 400) {
          throw new Error(`Bad request: ${errorMessage}`)
        } else {
          throw new Error(errorMessage)
        }
      }

      if (!res.body) {
        throw new Error("No response body from OpenAI API")
      }

      return res.body
    } catch (error) {
      // Re-throw the error with more context
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Unknown error occurred while calling OpenAI API")
    }
  }
}