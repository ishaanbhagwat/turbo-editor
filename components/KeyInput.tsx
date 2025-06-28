// components/KeyInput.tsx
"use client"
import { useState } from "react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"

interface KeyInputProps {
  onKeySaved?: () => void
}

export function KeyInput({ onKeySaved }: KeyInputProps) {
  const [key, setKey] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!key.trim()) {
      setError("Please enter an API key")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
    const res = await fetch("/api/set-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key })
    })

      if (!res.ok) {
        throw new Error(`Failed to save key: ${res.status} ${res.statusText}`)
      }

      setSuccess(true)
      setKey("")
      onKeySaved?.()
    } catch (err) {
      console.error("Error saving API key:", err)
      setError(err instanceof Error ? err.message : "Failed to save API key")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Paste your OpenAI API key..."
        value={key}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
        type="password"
        disabled={isLoading}
        className="bg-background border-border"
      />
      <Button onClick={handleSubmit} disabled={isLoading || !key.trim()}>
        {isLoading ? "Saving..." : "Save"}
      </Button>
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-2 rounded">
          Key saved securely ✅
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  )
}
