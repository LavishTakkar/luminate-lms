import { cn } from "../../lib/cn";

interface MeshGradientProps {
  className?: string;
  variant?: "light" | "auto";
  animated?: boolean;
}

/**
 * Full-bleed mesh-gradient backdrop. Light/dark aware via Tailwind's
 * `dark:` variant. Composited via transform on the gradient layer so it
 * stays GPU-friendly when animated.
 */
export function MeshGradient({
  className,
  variant = "auto",
  animated = true,
}: MeshGradientProps) {
  const bg =
    variant === "light"
      ? "bg-mesh-lavender"
      : "bg-mesh-lavender dark:bg-mesh-midnight";
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -inset-[20%]",
          bg,
          animated && "animate-mesh-drift",
        )}
      />
      {/* subtle grain so gradients don't look synthetic */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />
    </div>
  );
}
