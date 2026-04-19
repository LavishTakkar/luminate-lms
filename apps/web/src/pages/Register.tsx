import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.tsx";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, firstName, lastName });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <h1>Create account</h1>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 480 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Minimum 8 characters, including one letter and one digit.
          </div>
        </div>
        <button className="btn" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>
        {error && <div className="error">{error}</div>}
        <p className="muted" style={{ marginTop: 16 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
