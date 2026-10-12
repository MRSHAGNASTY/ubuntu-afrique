import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { auth } from "../../lib/supabase";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || "",
    };
  },
});

function RegisterPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    sponsorCode: ref || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreed) {
      setError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const data = await auth.signUp(
        formData.email,
        formData.password,
        formData.username,
        formData.sponsorCode || undefined
      );

      localStorage.setItem("auth_token", data.session?.access_token || "");
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            <h1 className="mt-6 font-display text-3xl font-bold">Create Account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Join Ubuntu Afrique. After login: dashboard, then KYC, then cards or fractions. KYC does not block CARD or FRACTION pay.
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
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
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
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3"
                  placeholder="Re-enter password"
                />
              </div>
              <div>
                <label htmlFor="sponsorCode" className="block text-sm font-medium mb-2">
                  Sponsor username or member id
                </label>
                <input
                  id="sponsorCode"
                  type="text"
                  value={formData.sponsorCode}
                  onChange={(e) => setFormData({ ...formData, sponsorCode: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="From ?ref= or type a Ubuntu username / ua_users.id"
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  id="agreed"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span>I accept the Ubuntu Afrique terms. New accounts stay on the Ubuntu book. No Aureus write.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gold-gradient px-6 py-3 font-semibold"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            New Ubuntu Afrique accounts write ua_users and ua_sponsor_tree only. First-run path: login, dashboard, KYC, then cards or invest. KYC does not block CARD or FRACTION pay.
          </p>
        </div>
      </div>
    </div>
  );
}
