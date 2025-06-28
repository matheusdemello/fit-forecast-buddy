import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'aggressive' | 'warrior' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border text-card-foreground shadow-sm transition-all duration-300",
      variant === 'aggressive' && 
        "bg-gradient-to-br from-gray-900/80 via-emerald-950/20 to-gray-900/80 border-emerald-600/30 shadow-glow backdrop-blur-sm relative overflow-hidden",
      variant === 'warrior' && 
        "bg-gradient-warrior border-emerald-500 shadow-warrior text-white relative overflow-hidden",
      variant === 'default' && "bg-card border-border",
      className
    )}
    {...props}
  >
    {variant === 'aggressive' && (
      <>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <div className="absolute bottom-2 left-2 text-emerald-600/40 text-xs">◆</div>
      </>
    )}
    {variant === 'warrior' && (
      <>
        <div className="absolute inset-0 bg-pattern-mandala opacity-20" />
        <div className="absolute top-3 right-3 text-emerald-300 text-lg animate-mandala-spin">⚡</div>
      </>
    )}
    {props.children}
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 relative z-10", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { variant?: 'default' | 'aggressive' }
>(({ className, variant = 'default', ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      variant === 'aggressive' && "font-aggressive text-emerald-300 text-shadow-glow",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0 relative z-10", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 relative z-10", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
