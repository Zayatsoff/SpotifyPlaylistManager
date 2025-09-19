import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border-border/60",
        outline: "bg-transparent text-foreground border-border/60",
        accent: "bg-accent/10 text-foreground border-accent/25",
        success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/25",
        info: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/25",
        warning: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/25",
        error: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))] border-[hsl(var(--error))]/25",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { badgeVariants }
