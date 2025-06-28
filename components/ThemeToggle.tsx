"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "../components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme()

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={theme === "light" ? "bg-accent text-accent-foreground" : ""}
        title="Light mode"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "bg-accent text-accent-foreground" : ""}
        title="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={theme === "system" ? "bg-accent text-accent-foreground" : ""}
        title="System mode"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
} 