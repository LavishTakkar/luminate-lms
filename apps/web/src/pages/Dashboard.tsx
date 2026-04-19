import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, MessageCircle } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { AppShell } from "../components/AppShell.tsx";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Summaries",
    body: "Condense long lessons into digestible notes or bullet points.",
  },
  {
    icon: BookOpen,
    title: "Quiz Generator",
    body: "Spin up quizzes from any content to test what you've learned.",
  },
  {
    icon: MessageCircle,
    title: "Always-on Tutor",
    body: "Ask the AI tutor anything — it remembers the conversation.",
  },
];

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pt-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Welcome back
              </p>
              <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
                Hello, {user?.firstName}.
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">
                {user?.role === "admin"
                  ? "Your library, your rules — create courses and let AI co-teach."
                  : "Pick up where you left off, or explore something new."}
              </p>
            </div>
            <Link to="/courses">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_6px_24px_-6px_hsl(var(--primary)/0.6)] transition-transform hover:-translate-y-0.5">
                Browse courses <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          {/* Feature bento */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              >
                <GlassCard className="group h-full cursor-default transition-transform hover:-translate-y-0.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Phase banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-10"
          >
            <GlassCard>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="font-serif text-2xl font-semibold">The app is online</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Phases 1–3 are live. Real Gemini calls turn on the moment you paste a
                    <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      GEMINI_API_KEY
                    </code>
                    into <code className="font-mono text-xs">.env</code>. Until then, AI
                    responses are stubbed so everything still demos.
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> API
                    connected
                  </span>
                  <span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" /> Role:{" "}
                    {user?.role}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.section>
      </AppShell>
    </div>
  );
}
