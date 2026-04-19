import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ListChecks,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import type { Lesson, QuizSummary, UserProgress } from "@lms/shared";
import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { AISummarizer } from "../components/ai/AISummarizer";
import { AITutorChat } from "../components/ai/AITutorChat";
import { QuizGenerator } from "../components/ai/QuizGenerator";
import { cn } from "../lib/cn";

type Panel = "summary" | "quiz" | "tutor";

const PANELS: Array<{ key: Panel; label: string; icon: typeof Sparkles }> = [
  { key: "summary", label: "Summary", icon: Sparkles },
  { key: "quiz", label: "Quiz me", icon: ListChecks },
  { key: "tutor", label: "Tutor", icon: MessageCircle },
];

export function LessonViewer() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [panel, setPanel] = useState<Panel>("summary");

  const lessonQuery = useQuery<Lesson>({
    queryKey: ["lesson", id],
    queryFn: () => apiGet<Lesson>(`/lessons/${id}`),
    enabled: !!id,
  });

  const quizzesQuery = useQuery<QuizSummary[]>({
    queryKey: ["lesson", id, "quizzes"],
    queryFn: () => apiGet<QuizSummary[]>(`/quizzes/by-lesson/${id}`),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: () => apiPost<UserProgress>(`/lessons/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["course"] });
    },
  });

  const lesson = lessonQuery.data;

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>

        {lessonQuery.isLoading && <GlassCard className="mt-4">Loading lesson…</GlassCard>}
        {lessonQuery.isError && (
          <GlassCard className="mt-4">
            <p className="text-destructive">Couldn't load this lesson.</p>
          </GlassCard>
        )}

        {lesson && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Main column — lesson content */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="min-w-0"
            >
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Lesson
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                {lesson.title}
              </h1>

              <GlassCard className="mt-6">
                <article className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed">
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                </article>
              </GlassCard>

              {quizzesQuery.data && quizzesQuery.data.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-serif text-xl font-semibold">Quizzes for this lesson</h2>
                  <div className="mt-3 space-y-2">
                    {quizzesQuery.data.map((q) => (
                      <Link key={q._id} to={`/quizzes/${q._id}`}>
                        <GlassCard
                          tight
                          className="group flex items-center justify-between transition-transform hover:-translate-y-0.5"
                        >
                          <div>
                            <p className="text-sm font-medium">{q.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {q.questions.length} questions · passing {q.passingScore}%
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                        </GlassCard>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {completeMutation.isPending
                    ? "Saving…"
                    : completeMutation.isSuccess
                      ? "Marked complete"
                      : "Mark as complete"}
                </Button>
                {completeMutation.isSuccess && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    Nice — progress saved.
                  </span>
                )}
              </div>
            </motion.div>

            {/* AI side panel */}
            <motion.aside
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex gap-2 rounded-full bg-white/60 p-1 backdrop-blur-md dark:bg-white/5">
                {PANELS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPanel(p.key)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      panel === p.key
                        ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.6)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <p.icon className="h-3.5 w-3.5" />
                    {p.label}
                  </button>
                ))}
              </div>

              {panel === "summary" && <AISummarizer content={lesson.content} />}
              {panel === "quiz" && (
                <QuizGenerator
                  content={lesson.content}
                  lessonId={lesson._id}
                  onSaved={() => qc.invalidateQueries({ queryKey: ["lesson", id, "quizzes"] })}
                />
              )}
              {panel === "tutor" && (
                <AITutorChat
                  lessonContext={{
                    content: lesson.content,
                    title: lesson.title,
                    lessonId: lesson._id,
                  }}
                />
              )}
            </motion.aside>
          </div>
        )}
      </AppShell>
    </div>
  );
}
