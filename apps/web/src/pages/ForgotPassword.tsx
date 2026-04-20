import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { apiPost } from "../lib/api";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MeshGradient />
      <div className="relative z-10 flex min-h-screen flex-col p-6">
        <header className="flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.7)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-serif text-xl font-semibold tracking-tight">Luminate</div>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <GlassCard className="sm:p-10">
              <div className="mb-8 text-center">
                <h1 className="font-serif text-4xl font-semibold tracking-tight">
                  Reset your password
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              {submitted ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm">
                    If an account exists for <strong>{email}</strong>, a reset link has been sent.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    In local dev, the reset URL is logged to the API terminal output — copy the{" "}
                    <code className="font-mono">/reset-password?token=…</code> URL from there.
                  </p>
                  <Link to="/login">
                    <Button variant="outline">Back to sign in</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? "Sending…" : "Send reset link"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Remembered it?{" "}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
