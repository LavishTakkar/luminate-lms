import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  tight?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, tight, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "glass rounded-[var(--radius)]",
        tight ? "p-4" : "p-6 sm:p-8",
        className,
      )}
      {...rest}
    />
  );
});
