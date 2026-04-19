import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, BookMarked, Loader2, Sparkles } from "lucide-react";
import { apiGet } from "../lib/api.ts";
import { AppShell } from "../components/AppShell.tsx";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import type { Course } from "@lms/shared";

const DIFFICULTY_TONE: Record<Course["difficulty"], string> = {
  beginner: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  advanced: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function CourseList() {
  const query = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => apiGet<Course[]>("/courses"),
  });

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <div className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              Library
            </p>
            <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">Courses</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Everything published across Luminate, sorted by newest.
            </p>
          </motion.div>

          <div className="mt-10">
            {query.isLoading && <LoadingState />}
            {query.isError && (
              <GlassCard>
                <p className="text-destructive">
                  Couldn't load courses. Is the API running on :5000?
                </p>
              </GlassCard>
            )}
            {query.data && query.data.length === 0 && <EmptyState />}
            {query.data && query.data.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">
                {query.data.map((course, i) => (
                  <motion.article
                    key={course._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <GlassCard className="group relative h-full transition-transform hover:-translate-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${
                              DIFFICULTY_TONE[course.difficulty]
                            }`}
                          >
                            {course.difficulty}
                          </span>
                          <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight">
                            {course.title}
                          </h2>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                        {course.description}
                      </p>
                      <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <BookMarked className="h-3.5 w-3.5" />
                          {course.modules?.length ?? 0} modules
                        </span>
                        <span>·</span>
                        <span className="capitalize">{course.category}</span>
                        {course.tags?.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="truncate">{course.tags.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </GlassCard>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard key={i} className="h-[180px] animate-pulse">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="mt-4 h-6 w-3/4 rounded-full bg-muted" />
          <div className="mt-3 h-3 w-full rounded-full bg-muted" />
          <div className="mt-2 h-3 w-5/6 rounded-full bg-muted" />
        </GlassCard>
      ))}
      <div className="col-span-full flex items-center justify-center pt-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-serif text-2xl font-semibold">No courses yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Seed sample data with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          pnpm --filter api seed
        </code>
        , or sign in as admin and create your first course.
      </p>
    </GlassCard>
  );
}
