import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5",
        outline:
          "border-2 border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:-translate-y-0.5 hover:bg-blue-50",
        secondary:
          "bg-slate-200 text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-300",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        sm: "h-8 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-3xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
