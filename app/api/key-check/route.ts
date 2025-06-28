import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies()
  const key = cookieStore.get("llm_api_key")?.value
  if (!key) return new Response(JSON.stringify({ exists: false }), { status: 200 })

  return new Response(JSON.stringify({ exists: true }), { status: 200 })
}