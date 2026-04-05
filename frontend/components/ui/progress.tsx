import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: "default" | "success" | "warning" | "error"
}

function Progress({ 
  className, 
  value = 0, 
  max = 100,
  variant = "default",
  ...props 
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const variants = {
    default: "bg-primary-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    error: "bg-error-500",
  }
  
  return (
    <div
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-300", variants[variant])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
export type { ProgressProps }
