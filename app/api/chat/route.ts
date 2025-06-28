import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getProvider } from "@/lib/llm/registry"
import { LLMMessage } from "@/lib/llm/providers/base"

export async function POST(req: NextRequest) {
  try {
    // Read API key directly from cookies instead of relying on middleware
    const cookieStore = await cookies()
    const apiKey = cookieStore.get("llm_api_key")?.value
    
    console.log("Chat route - All headers:", Object.fromEntries(req.headers.entries()))
    console.log("Chat route - API key from cookie:", apiKey ? "FOUND" : "NOT FOUND")
    
    if (!apiKey) {
      console.log("Chat route - No API key in cookies")
      return new Response(
        JSON.stringify({ error: "Missing API key" }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const { provider = "openai", messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required and cannot be empty" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content || 
          !["user", "assistant", "system"].includes(message.role)) {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }), 
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        )
      }
    }

    console.log("Chat route - Calling LLM provider with key length:", apiKey.length)
    const llm = getProvider(provider)
    const stream = await llm.stream(messages, apiKey)

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })
  } catch (error) {
    console.error("Chat API error:", error)
    
    // Handle specific provider errors
    if (error instanceof Error && error.message.includes("not found")) {
      return new Response(
        JSON.stringify({ error: "LLM provider not supported" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Handle API key errors
    if (error instanceof Error && error.message.includes("401")) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}