import { Suspense, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { MeshGradient } from "./ui/MeshGradient";
import { GlassCard } from "./ui/GlassCard";

export function RouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function RouteFallback() {
  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <GlassCard className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </GlassCard>
      </main>
    </div>
  );
}
