import { Component, type ErrorInfo, type ReactNode } from "react";
import { GlassCard } from "./ui/GlassCard";
import { MeshGradient } from "./ui/MeshGradient";
import { Button } from "./ui/Button";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[error-boundary] caught:", error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="relative min-h-screen">
        <MeshGradient />
        <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <GlassCard className="max-w-md">
            <h1 className="font-serif text-3xl font-semibold">Something broke</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The app hit an unexpected error. A quick reload usually fixes it.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/5 p-3 text-xs text-destructive dark:bg-white/5">
              {this.state.error.message}
            </pre>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Reload app
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }
}
