import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    console.log("Current cookies:", allCookies)
    
    // Clear the specific cookie
    cookieStore.delete("llm_api_key")
    
    return new Response(
      JSON.stringify({ 
        message: "Cookies cleared successfully",
        previousCookies: allCookies.map(c => c.name)
      }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error clearing cookies:", error)
    return new Response(
      JSON.stringify({ error: "Failed to clear cookies" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 