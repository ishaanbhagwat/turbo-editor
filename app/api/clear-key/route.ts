import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("llm_api_key")

    return new Response(
      JSON.stringify({ message: "API key cleared successfully" }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error clearing API key:", error)
    return new Response(
      JSON.stringify({ error: "Failed to clear API key" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 