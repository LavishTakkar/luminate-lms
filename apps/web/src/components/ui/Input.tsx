import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-white/70 dark:bg-white/5",
          "px-4 text-sm text-foreground placeholder:text-muted-foreground",
          "backdrop-blur-sm transition-[border-color,box-shadow] duration-150",
          "focus-visible:outline-none focus-visible:border-primary",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);
