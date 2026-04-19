import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/auth.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";
import { Login } from "./pages/Login.tsx";
import { Register } from "./pages/Register.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { CourseList } from "./pages/CourseList.tsx";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
                  <CourseList />
                </RequireAuth>
              }
            />
            <Route path="*" element={<div style={{ padding: 24 }}>404 — Not found</div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
