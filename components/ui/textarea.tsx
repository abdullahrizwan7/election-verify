import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-2xl border border-transparent bg-foreground/[0.05] px-4 py-3 text-base font-medium transition-[background-color,border-color,box-shadow] duration-300 outline-none hover:bg-foreground/[0.07] focus-visible:bg-background placeholder:text-muted-foreground focus-visible:border-brand/60 focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
