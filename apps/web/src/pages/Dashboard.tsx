import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.tsx";

export function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Welcome, {user?.firstName}</h1>
        <button className="btn btn-secondary" onClick={logout}>
          Sign out
        </button>
      </div>
      <p className="muted">
        Role: <strong>{user?.role}</strong>
      </p>

      <div className="card">
        <h2>Next steps</h2>
        <ul>
          <li>
            <Link to="/courses">Browse courses</Link>
          </li>
          {user?.role === "admin" && (
            <li className="muted">Admin controls coming in Phase 3 UI.</li>
          )}
        </ul>
      </div>

      <div className="card">
        <h2>Phase 1 is up</h2>
        <p className="muted">
          This is the minimal functional skeleton. Premium UI (Shadcn + Aceternity + gradients +
          glassmorphism) lands in Phase 3. Real Gemini AI lands in Phase 2.
        </p>
      </div>
    </div>
  );
}
