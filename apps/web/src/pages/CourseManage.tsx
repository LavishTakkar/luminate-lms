import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import { api } from "../lib/api";
import type { Course, Lesson, Module } from "@lms/shared";
import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

async function apiDelete(path: string): Promise<void> {
  const res = await api.delete(path);
  if (!res.data?.success) throw new Error("Delete failed");
}

export function CourseManage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const courseQuery = useQuery<Course>({
    queryKey: ["admin", "course", id],
    queryFn: () => apiGet<Course>(`/courses/${id}`),
    enabled: !!id,
  });

  const modulesQuery = useQuery<Module[]>({
    queryKey: ["admin", "course", id, "modules"],
    queryFn: () => apiGet<Module[]>(`/courses/${id}/modules`),
    enabled: !!id,
  });

  const addModule = useMutation({
    mutationFn: (title: string) =>
      apiPost<Module>("/modules", { courseId: id, title, order: modulesQuery.data?.length ?? 0 }),
    onSuccess: () => {
      setNewModuleTitle("");
      qc.invalidateQueries({ queryKey: ["admin", "course", id, "modules"] });
    },
  });

  const deleteModule = useMutation({
    mutationFn: (moduleId: string) => apiDelete(`/modules/${moduleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "course", id, "modules"] }),
  });

  function submitModule(e: FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    addModule.mutate(newModuleTitle.trim());
  }

  const course = courseQuery.data;

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

        {courseQuery.isLoading && <GlassCard className="mt-4">Loading…</GlassCard>}

        {course && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              Admin · managing
            </p>
            <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {course.isPublished ? "Published" : "Draft"} · {course.difficulty} ·{" "}
              {course.category}
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link to={`/courses/${course._id}`}>
                <Button variant="outline">View as student</Button>
              </Link>
            </div>

            <h2 className="mt-10 font-serif text-2xl font-semibold">Modules</h2>

            <form
              onSubmit={submitModule}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              <Input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Module title — e.g. Foundations"
                className="max-w-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={addModule.isPending || !newModuleTitle.trim()}
              >
                {addModule.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add module
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {modulesQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No modules yet — add one above.
                </p>
              )}
              {modulesQuery.data?.map((m) => (
                <ModuleEditor
                  key={m._id}
                  mod={m}
                  onDelete={() => deleteModule.mutate(m._id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AppShell>
    </div>
  );
}

function ModuleEditor({ mod, onDelete }: { mod: Module; onDelete: () => void }) {
  const qc = useQueryClient();
  const [newLesson, setNewLesson] = useState({ title: "", content: "" });

  const lessonsQuery = useQuery<Lesson[]>({
    queryKey: ["admin", "module", mod._id, "lessons"],
    queryFn: () => apiGet<Lesson[]>(`/modules/${mod._id}/lessons`),
  });

  const [videoUrl, setVideoUrl] = useState("");

  const addLesson = useMutation({
    mutationFn: () =>
      apiPost<Lesson>("/lessons", {
        moduleId: mod._id,
        title: newLesson.title,
        content: newLesson.content,
        ...(videoUrl.trim() ? { videoUrl: videoUrl.trim(), contentType: "video" } : {}),
        order: lessonsQuery.data?.length ?? 0,
      }),
    onSuccess: () => {
      setNewLesson({ title: "", content: "" });
      setVideoUrl("");
      qc.invalidateQueries({ queryKey: ["admin", "module", mod._id, "lessons"] });
    },
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => apiDelete(`/lessons/${lessonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "module", mod._id, "lessons"] }),
  });

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-serif text-xl font-semibold">{mod.title}</h3>
          </div>
          {mod.description && (
            <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Delete module"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {lessonsQuery.data?.map((l) => (
          <div
            key={l._id}
            className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-2.5 text-sm dark:bg-white/5"
          >
            <span className="font-medium">{l.title}</span>
            <button
              onClick={() => deleteLesson.mutate(l._id)}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Delete lesson"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newLesson.title.trim()) return;
          addLesson.mutate();
        }}
        className="mt-4 space-y-2 rounded-xl bg-white/40 p-3 dark:bg-white/5"
      >
        <Input
          value={newLesson.title}
          onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
          placeholder="Lesson title"
        />
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video URL (optional) — YouTube, Vimeo, MP4…"
        />
        <textarea
          value={newLesson.content}
          onChange={(e) => setNewLesson((p) => ({ ...p, content: e.target.value }))}
          placeholder="Lesson content (markdown supported)"
          rows={3}
          className="w-full rounded-xl border border-border bg-white/70 px-4 py-2 text-sm dark:bg-white/5"
        />
        <Button
          type="submit"
          size="sm"
          disabled={addLesson.isPending || !newLesson.title.trim()}
        >
          {addLesson.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add lesson
        </Button>
      </form>
    </GlassCard>
  );
}
