import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  imageSrc?: string
  label: string
  onRemove?: () => void
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ imageSrc, label, onRemove, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary px-2.5 py-1 text-xs text-foreground",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          className
        )}
        {...props}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="" className="w-4 h-4 rounded-sm" aria-hidden="true" />
        ) : (
          <span className="w-4 h-4 rounded-sm bg-muted/40" aria-hidden="true" />
        )}
        <span className="truncate max-w-[10rem]" title={label}>{label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Unselect ${label}`}
            className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/20"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }
)
Chip.displayName = "Chip"
