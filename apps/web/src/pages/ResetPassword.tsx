import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { apiPost } from "../lib/api";
import type { AuthResponse } from "@lms/shared";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { setToken } from "../lib/api";

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiPost<AuthResponse>("/auth/reset-password", { token, password });
      setToken(data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
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
                  Choose a new password
                </h1>
              </div>

              {!token && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  This reset link is missing its token. Request a new one from{" "}
                  <Link to="/forgot-password" className="font-medium underline">
                    the forgot page
                  </Link>
                  .
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      New password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min 8 chars, letters + digits"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Confirm password
                    </label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? "Resetting…" : "Reset & sign in"}
                  </Button>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
