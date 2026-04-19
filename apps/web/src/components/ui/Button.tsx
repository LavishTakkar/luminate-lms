import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-full " +
    "transition-[transform,box-shadow,background-color] duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_6px_24px_-6px_hsl(var(--primary)/0.6)] " +
          "hover:shadow-[0_10px_32px_-6px_hsl(var(--primary)/0.65)] hover:-translate-y-0.5",
        ghost: "text-foreground hover:bg-white/40 dark:hover:bg-white/5",
        glass: "glass-sm text-foreground hover:-translate-y-0.5",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, ...rest },
  ref,
) {
  return <button ref={ref} className={cn(button({ variant, size }), className)} {...rest} />;
});
