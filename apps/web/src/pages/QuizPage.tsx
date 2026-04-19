import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import type { QuizSummary, QuizSubmitResponse } from "@lms/shared";
import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";

export function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);

  const quizQuery = useQuery<QuizSummary>({
    queryKey: ["quiz", id],
    queryFn: () => apiGet<QuizSummary>(`/quizzes/${id}`),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (body: { answers: Array<{ questionIndex: number; answer: string }> }) =>
      apiPost<QuizSubmitResponse>(`/quizzes/${id}/submit`, body),
    onSuccess: (data) => setResult(data),
  });

  const quiz = quizQuery.data;
  const allAnswered = useMemo(
    () =>
      quiz ? quiz.questions.every((_, i) => typeof answers[i] === "string" && answers[i] !== "") : false,
    [quiz, answers],
  );

  function handleSubmit() {
    if (!quiz) return;
    const payload = quiz.questions.map((_, i) => ({
      questionIndex: i,
      answer: answers[i] ?? "",
    }));
    submitMutation.mutate({ answers: payload });
  }

  function retry() {
    setResult(null);
    setAnswers({});
  }

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {quizQuery.isLoading && (
          <GlassCard className="mt-4 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading quiz…</span>
          </GlassCard>
        )}

        {quiz && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Quiz</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="mt-2 text-muted-foreground">{quiz.description}</p>
            )}

            {!result && (
              <div className="mt-8 space-y-4">
                {quiz.questions.map((q, i) => (
                  <GlassCard key={i}>
                    <p className="font-medium">
                      {i + 1}. {q.questionText}
                    </p>
                    <div className="mt-4 space-y-2">
                      {q.questionType === "multiple-choice" && q.options?.map((opt) => (
                        <OptionRow
                          key={opt}
                          label={opt}
                          selected={answers[i] === opt}
                          onClick={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                        />
                      ))}
                      {q.questionType === "true-false" && ["True", "False"].map((opt) => (
                        <OptionRow
                          key={opt}
                          label={opt}
                          selected={answers[i] === opt}
                          onClick={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                        />
                      ))}
                      {q.questionType === "short-answer" && (
                        <input
                          type="text"
                          value={answers[i] ?? ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                          }
                          className="h-11 w-full rounded-xl border border-border bg-white/70 px-4 text-sm dark:bg-white/5"
                          placeholder="Type your answer…"
                        />
                      )}
                    </div>
                  </GlassCard>
                ))}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Grading…
                      </>
                    ) : (
                      <>Submit answers</>
                    )}
                  </Button>
                  {!allAnswered && (
                    <span className="text-xs text-muted-foreground">
                      Answer every question before submitting.
                    </span>
                  )}
                </div>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-4"
                >
                  <GlassCard>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Your score
                        </p>
                        <p className="font-serif text-5xl font-semibold">
                          {result.scorePercent}%
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-full px-4 py-1.5 text-sm font-semibold",
                          result.passed
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {result.passed ? "Passed" : "Below passing"}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {result.totalEarned} of {result.totalPossible} points · passing at{" "}
                      {result.passingScore}%
                    </p>
                  </GlassCard>

                  {result.graded.map((g) => (
                    <GlassCard key={g.questionIndex}>
                      <div className="flex items-start gap-3">
                        {g.isCorrect ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 text-rose-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{g.questionText}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Your answer:{" "}
                            <span className={cn(!g.isCorrect && "text-rose-600 dark:text-rose-400")}>
                              {String(g.userAnswer) || "(blank)"}
                            </span>
                          </p>
                          {!g.isCorrect && (
                            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                              Correct answer: {String(g.correctAnswer)}
                            </p>
                          )}
                          {g.explanation && (
                            <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs">
                              <strong>Why:</strong> {g.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  ))}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={retry}>
                      Retake
                    </Button>
                    <Link to="/dashboard" className="inline-block">
                      <Button variant="ghost">Back to dashboard</Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AppShell>
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10",
      )}
    >
      <span>{label}</span>
      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
    </button>
  );
}
