import { type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { cn } from "../lib/cn";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Button } from "./ui/Button";

const NAV: Array<{ to: string; label: string; icon: typeof BookOpen; adminOnly?: boolean }> = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/courses/new", label: "New course", icon: PenSquare, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="relative min-h-full">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px]">
        {/* Sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 lg:block">
          <SidebarInner onNavigate={() => setOpen(false)} user={user} onLogout={handleLogout} />
        </aside>

        {/* Sidebar — mobile slide-in */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                <SidebarInner
                  onNavigate={() => setOpen(false)}
                  user={user}
                  onLogout={handleLogout}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main area */}
        <div className="relative flex-1">
          {/* Top bar on mobile */}
          <div className="sticky top-0 z-30 flex items-center justify-between p-4 lg:hidden">
            <Button variant="glass" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>

          <main id="main" className="px-4 pb-16 sm:px-6 lg:px-10 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarInner({
  user,
  onNavigate,
  onLogout,
}: {
  user: { firstName: string; lastName: string; email: string; role: string } | null;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="glass flex h-full flex-col rounded-[var(--radius)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.7)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-serif text-lg font-semibold tracking-tight">Luminate</div>
          </div>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <button className="lg:hidden" onClick={onNavigate} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mt-auto space-y-3 border-t border-white/30 dark:border-white/10 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
