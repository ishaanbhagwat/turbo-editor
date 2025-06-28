import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json()

  if (!apiKey || typeof apiKey !== "string") {
    return new Response("Invalid API Key", { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set("llm_api_key", apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  return new Response("Key stored", { status: 200 })
}