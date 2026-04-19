import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { apiPost } from "../lib/api";
import type { Course, Difficulty } from "@lms/shared";
import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../lib/cn";

const DIFFS: Difficulty[] = ["beginner", "intermediate", "advanced"];

export function CourseCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<Course>("/courses", body),
    onSuccess: (course) => navigate(`/admin/courses/${course._id}/manage`),
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to create"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate({
      title,
      description,
      category,
      difficulty,
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isPublished,
    });
  }

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6"
        >
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Admin · new course
          </p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">
            Create a course
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            You'll add modules and lessons on the next screen.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-4">
            <GlassCard>
              <div className="space-y-4">
                <Field label="Title" htmlFor="title">
                  <Input
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Intro to Machine Learning"
                  />
                </Field>

                <Field label="Description" htmlFor="description">
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What will learners walk away with?"
                    className="w-full rounded-xl border border-border bg-white/70 px-4 py-3 text-sm dark:bg-white/5"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category" htmlFor="category">
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="ai, web, ops…"
                    />
                  </Field>
                  <Field label="Difficulty">
                    <div className="flex gap-2">
                      {DIFFS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={cn(
                            "flex-1 rounded-xl px-3 py-2 text-xs font-medium capitalize",
                            difficulty === d
                              ? "bg-primary text-primary-foreground"
                              : "bg-white/60 text-muted-foreground hover:text-foreground dark:bg-white/5",
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <Field label="Tags (comma-separated)" htmlFor="tags">
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="react, typescript, hooks"
                  />
                </Field>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  Publish immediately (otherwise it's a draft)
                </label>
              </div>
            </GlassCard>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={create.isPending || !title.trim()}>
              {create.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Create course
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </AppShell>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
