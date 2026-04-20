import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Award, BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import type { Certificate, Course, Lesson, Module, UserProgress } from "@lms/shared";
import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/ui/GlassCard";
import { MeshGradient } from "../components/ui/MeshGradient";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";

type CourseWithModules = Omit<Course, "modules"> & {
  modules: Array<Module & { lessons: Lesson[] }>;
};

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const courseQuery = useQuery<CourseWithModules>({
    queryKey: ["course", id],
    queryFn: () => apiGet<CourseWithModules>(`/courses/${id}`),
    enabled: !!id,
  });

  const modulesQuery = useQuery<Module[]>({
    queryKey: ["course", id, "modules"],
    queryFn: () => apiGet<Module[]>(`/courses/${id}/modules`),
    enabled: !!id,
  });

  const progressQuery = useQuery<UserProgress | null>({
    queryKey: ["course", id, "progress"],
    queryFn: () => apiGet<UserProgress | null>(`/progress/course/${id}`),
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: () => apiPost<UserProgress>(`/courses/${id}/enroll`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id, "progress"] });
      qc.invalidateQueries({ queryKey: ["progress", "overview"] });
    },
  });

  const claimCert = useMutation({
    mutationFn: () => apiPost<Certificate>("/certificates/generate", { courseId: id }),
    onSuccess: (cert) => navigate(`/certificates/${cert._id}`),
  });

  if (!id) return null;

  const course = courseQuery.data;
  const modules = modulesQuery.data ?? [];
  const completedLessonIds = new Set(
    (progressQuery.data?.completedLessons ?? []).map((x) => String(x)),
  );
  const isEnrolled = !!progressQuery.data;
  const totalLessons = modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const progressPct =
    totalLessons > 0 ? Math.round((completedLessonIds.size / totalLessons) * 100) : 0;
  const certIssued = !!progressQuery.data?.certificateIssued;
  const certUrl = progressQuery.data?.certificateUrl;

  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <AppShell>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All courses
        </Link>

        {courseQuery.isLoading && (
          <GlassCard className="mt-4">Loading course…</GlassCard>
        )}

        {course && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              {course.category}
            </p>
            <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{course.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isEnrolled ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Enrolled · {progressPct}%
                </span>
              ) : (
                <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                  {enrollMutation.isPending ? "Enrolling…" : "Enroll in course"}
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {modules.length} modules · {totalLessons} lessons
              </span>

              {isEnrolled && progressPct === 100 && !certIssued && (
                <Button
                  onClick={() => claimCert.mutate()}
                  disabled={claimCert.isPending}
                  className="ml-auto"
                >
                  <Award className="h-4 w-4" />
                  {claimCert.isPending ? "Issuing…" : "Claim certificate"}
                </Button>
              )}

              {certIssued && certUrl && (
                <Link to={certUrl} className="ml-auto">
                  <Button variant="outline">
                    <Award className="h-4 w-4" /> View certificate
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {modules.length > 0 && (
          <div className="mt-10 space-y-4">
            {modules.map((mod, mi) => (
              <GlassCard key={mod._id}>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Module {mi + 1}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-semibold">{mod.title}</h2>
                    {mod.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
                    )}
                  </div>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>

                <ModuleLessons
                  moduleId={mod._id}
                  completedLessonIds={completedLessonIds}
                  onPick={(lessonId) => navigate(`/lessons/${lessonId}`)}
                />
              </GlassCard>
            ))}
          </div>
        )}
      </AppShell>
    </div>
  );
}

function ModuleLessons({
  moduleId,
  completedLessonIds,
  onPick,
}: {
  moduleId: string;
  completedLessonIds: Set<string>;
  onPick: (lessonId: string) => void;
}) {
  const lessonsQuery = useQuery<Lesson[]>({
    queryKey: ["module", moduleId, "lessons"],
    queryFn: () => apiGet<Lesson[]>(`/modules/${moduleId}/lessons`),
  });

  if (lessonsQuery.isLoading) {
    return <p className="mt-4 text-sm text-muted-foreground">Loading lessons…</p>;
  }
  if (!lessonsQuery.data?.length) {
    return <p className="mt-4 text-sm text-muted-foreground">No lessons yet.</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-white/30 dark:divide-white/5">
      {lessonsQuery.data.map((lesson, i) => {
        const done = completedLessonIds.has(String(lesson._id));
        return (
          <li key={lesson._id}>
            <button
              onClick={() => onPick(lesson._id)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-primary"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
                    done
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-white/60 text-muted-foreground dark:bg-white/5",
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="text-sm font-medium">{lesson.title}</span>
              </div>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
