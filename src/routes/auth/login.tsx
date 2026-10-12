import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { auth } from "../../lib/supabase";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" && search.next.startsWith("/dashboard") ? search.next : "/dashboard",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/login" });
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await auth.signIn(formData.email, formData.password);
      localStorage.setItem("auth_token", data.session?.access_token || "");
      if (search.next === "/dashboard/pay") {
        navigate({ to: "/dashboard/pay" });
      } else if (search.next === "/dashboard/kyc") {
        navigate({ to: "/dashboard/kyc" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-gold-gradient text-primary-foreground font-display font-bold shadow-[var(--shadow-gold)]">
                UA
              </span>
            </Link>
            <h1 className="mt-6 font-display text-3xl font-bold">Sign In</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Access your Ubuntu Afrique account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="text-gold hover:text-gold/80">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-gradient px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-gold)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/auth/register" className="font-semibold text-gold hover:text-gold/80">
              Create account
            </Link>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-center text-xs text-muted-foreground">
              Existing Aureus.africa users sign in here with the same email and password. No second registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
