import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ListChecks, Save } from "lucide-react";
import { apiPost } from "../../lib/api";
import type { GeneratedQuizResponse, QuizSummary } from "@lms/shared";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../lib/auth.tsx";

type Difficulty = "beginner" | "medium" | "advanced";

interface QuizGeneratorProps {
  content: string;
  lessonId?: string;
  onSaved?: (quiz: QuizSummary) => void;
}

export function QuizGenerator({ content, lessonId, onSaved }: QuizGeneratorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [quiz, setQuiz] = useState<GeneratedQuizResponse["quiz"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  async function generate() {
    setLoading(true);
    setError(null);
    setRevealed(new Set());
    setSaved(false);
    try {
      const data = await apiPost<GeneratedQuizResponse>("/ai/generate-quiz", {
        content,
        questionCount,
        difficulty,
        lessonId,
      });
      setQuiz(data.quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  }

  async function saveToLesson() {
    if (!quiz || !lessonId) return;
    setSaving(true);
    setError(null);
    try {
      const savedQuiz = await apiPost<QuizSummary>("/quizzes", {
        lessonId,
        title: quiz.title,
        questions: quiz.questions,
        isAIGenerated: true,
        sourceContent: content.slice(0, 5000),
      });
      setSaved(true);
      onSaved?.(savedQuiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  }

  function toggleReveal(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <GlassCard>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ListChecks className="h-4 w-4" />
        </div>
        <h3 className="font-serif text-xl font-semibold">Quiz me</h3>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Questions</label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="mt-1.5 h-10 w-full rounded-xl border border-border bg-white/70 px-3 text-sm dark:bg-white/5"
          >
            {[3, 5, 10].map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Difficulty</label>
          <div className="mt-1.5 flex gap-2">
            {(["beginner", "medium", "advanced"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "flex-1 rounded-xl px-2 py-2 text-xs font-medium capitalize transition-colors",
                  difficulty === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/60 text-muted-foreground hover:text-foreground dark:bg-white/5",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={generate} disabled={loading || !content} size="sm" className="mt-5">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
        {loading ? "Generating" : quiz ? "Regenerate" : "Generate quiz"}
      </Button>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <AnimatePresence>
        {quiz && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-serif text-lg font-semibold">{quiz.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {quiz.questions.length} questions · tap to reveal answer
                </p>
              </div>
              {isAdmin && lessonId && (
                <Button
                  onClick={saveToLesson}
                  disabled={saving || saved}
                  size="sm"
                  variant={saved ? "outline" : "primary"}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4" /> Saved to lesson
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save to lesson
                    </>
                  )}
                </Button>
              )}
            </div>

            {quiz.questions.map((q, i) => {
              const shown = revealed.has(i);
              return (
                <div
                  key={i}
                  className="rounded-xl bg-white/50 p-4 transition-colors dark:bg-white/5"
                >
                  <p className="text-sm font-medium">
                    {i + 1}. {q.questionText}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {q.options.map((opt, j) => {
                        const isCorrect = shown && opt === q.correctAnswer;
                        return (
                          <li
                            key={j}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                              isCorrect
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-white/40 text-foreground dark:bg-white/5",
                            )}
                          >
                            {isCorrect && <Check className="h-3.5 w-3.5" />}
                            {opt}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!q.options?.length && shown && (
                    <p className="mt-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                      Answer: <strong>{q.correctAnswer}</strong>
                    </p>
                  )}
                  {shown && q.explanation && (
                    <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-foreground">
                      <strong>Why:</strong> {q.explanation}
                    </p>
                  )}
                  <button
                    onClick={() => toggleReveal(i)}
                    className="mt-3 text-xs font-medium text-primary hover:underline"
                  >
                    {shown ? "Hide" : "Reveal answer"}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
