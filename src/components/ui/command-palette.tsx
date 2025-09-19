import * as React from "react"
import { cn } from "@/lib/utils"

export type Command = {
  id: string
  label: string
  hint?: string
  run: () => void
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: Command[]
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setQuery("")
      const id = window.setTimeout(() => inputRef.current?.focus(), 10)
      return () => window.clearTimeout(id)
    }
  }, [isOpen])

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(c => c.label.toLowerCase().includes(q))
  }, [commands, query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-lg border border-border bg-background shadow-lg">
        <div className="flex items-center border-b border-border/60 px-3 py-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            className="w-full bg-transparent outline-none text-sm"
            aria-label="Command palette"
          />
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No commands</div>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent/10", "flex items-center justify-between")}
                    onClick={() => {
                      c.run()
                      onClose()
                    }}
                    aria-label={c.label}
                  >
                    <span>{c.label}</span>
                    {c.hint && <span className="text-xs text-muted-foreground">{c.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
