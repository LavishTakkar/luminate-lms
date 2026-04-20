import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { RouteSuspense } from "./components/RouteSuspense.tsx";
import { Login } from "./pages/Login.tsx";
import { Register } from "./pages/Register.tsx";
import { ForgotPassword } from "./pages/ForgotPassword.tsx";
import { ResetPassword } from "./pages/ResetPassword.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import "./styles.css";

// Code-split heavier routes — CourseList pulls in more icons,
// CourseDetail fetches modules/lessons, LessonViewer pulls
// react-markdown + all three AI components.
const CourseList = lazy(() =>
  import("./pages/CourseList.tsx").then((m) => ({ default: m.CourseList })),
);
const CourseDetail = lazy(() =>
  import("./pages/CourseDetail.tsx").then((m) => ({ default: m.CourseDetail })),
);
const LessonViewer = lazy(() =>
  import("./pages/LessonViewer.tsx").then((m) => ({ default: m.LessonViewer })),
);
const QuizPage = lazy(() =>
  import("./pages/QuizPage.tsx").then((m) => ({ default: m.QuizPage })),
);
const CourseCreate = lazy(() =>
  import("./pages/CourseCreate.tsx").then((m) => ({ default: m.CourseCreate })),
);
const CourseManage = lazy(() =>
  import("./pages/CourseManage.tsx").then((m) => ({ default: m.CourseManage })),
);
const CertificatePage = lazy(() =>
  import("./pages/CertificatePage.tsx").then((m) => ({ default: m.CertificatePage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
              >
                Skip to content
              </a>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/courses"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <CourseList />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/courses/:id"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <CourseDetail />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lessons/:id"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <LessonViewer />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/quizzes/:id"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <QuizPage />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/courses/new"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <CourseCreate />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/courses/:id/manage"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <CourseManage />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/certificates/:id"
                  element={
                    <RequireAuth>
                      <RouteSuspense>
                        <CertificatePage />
                      </RouteSuspense>
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
);

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-6xl">404</h1>
        <p className="mt-2 text-muted-foreground">That page doesn't exist.</p>
      </div>
    </div>
  );
}
