import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, firstName, lastName });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MeshGradient />
      <div className="relative z-10 flex min-h-screen flex-col p-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.7)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-serif text-xl font-semibold tracking-tight">Luminate</div>
          </div>
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
                  Start learning
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your account to unlock courses and AI tutoring.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="firstName"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      First name
                    </label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Ada"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="lastName"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Last name
                    </label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Lovelace"
                    />
                  </div>
                </div>
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
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    Password
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

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Creating…" : "Create account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Have an account already?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </GlassCard>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
