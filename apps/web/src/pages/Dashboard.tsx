import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { apiGet } from "../lib/api";
import type { AIStatusResponse, ProgressOverview } from "@lms/shared";
import { AppShell } from "../components/AppShell.tsx";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { cn } from "../lib/cn";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Summaries",
    body: "Condense long lessons into digestible notes or bullet points.",
  },
  {
    icon: BookOpen,
    title: "Quiz Generator",
    body: "Spin up quizzes from any lesson to test what you've learned.",
  },
  {
    icon: MessageCircle,
    title: "Always-on Tutor",
    body: "Ask the AI tutor anything — it remembers the conversation.",
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const overview = useQuery<ProgressOverview>({
    queryKey: ["progress", "overview"],
    queryFn: () => apiGet<ProgressOverview>("/progress/overview"),
  });

  const aiStatus = useQuery<AIStatusResponse>({
    queryKey: ["ai", "status"],
    queryFn: () => apiGet<AIStatusResponse>("/ai/status"),
    staleTime: 5 * 60_000,
  });

  const stats = overview.data?.totals;
  const recent = overview.data?.courses.slice(0, 3) ?? [];

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
              {aiStatus.data && <AiStatusBadge stubbed={aiStatus.data.stubbed} />}
            </div>
            <Link to="/courses">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_6px_24px_-6px_hsl(var(--primary)/0.6)] transition-transform hover:-translate-y-0.5">
                Browse courses <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          {/* Stat strip */}
          {stats && stats.enrolledCount > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard
                icon={BookOpen}
                label="Enrolled"
                value={stats.enrolledCount}
                tone="primary"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed courses"
                value={stats.completedCourses}
                tone="emerald"
              />
              <StatCard
                icon={Flame}
                label="Lessons finished"
                value={stats.totalLessonsCompleted}
                tone="amber"
              />
            </div>
          )}

          {/* Continue learning */}
          {recent.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-semibold">Continue learning</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {recent.map((c) => (
                  <Link key={c.courseId} to={`/courses/${c.courseId}`}>
                    <GlassCard className="group transition-transform hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-xl font-semibold leading-snug">
                            {c.courseTitle}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {c.completedLessons} / {c.totalLessons} lessons
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/50 dark:bg-white/5">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${c.progressPercentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {c.progressPercentage}% complete
                      </p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Feature bento */}
          <h2 className="mt-12 font-serif text-2xl font-semibold">What you can do</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Phase banner — only for first-run users with no enrollment yet */}
          {stats && stats.enrolledCount === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-10"
            >
              <GlassCard>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-serif text-xl font-semibold">Get started</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Browse the library and enroll in a course to start tracking progress.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </motion.section>
      </AppShell>
    </div>
  );
}

interface StatCardProps {
  icon: typeof BookOpen;
  label: string;
  value: number;
  tone: "primary" | "emerald" | "amber";
}

function AiStatusBadge({ stubbed }: { stubbed: boolean }) {
  if (stubbed) {
    return (
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        AI responses are stubbed — add <code className="font-mono">GEMINI_API_KEY</code> to go live
      </div>
    );
  }
  return (
    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
      Gemini live
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: StatCardProps) {
  const tones = {
    primary: "bg-primary/15 text-primary",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  return (
    <GlassCard tight>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-serif text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}
