import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setInfo("Account created! Please check your email to confirm, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(
        msg.toLowerCase().includes("invalid login")
          ? "Wrong email or password."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
      </header>

      <section className="px-6">
        <div className="flex items-center gap-2">
          <BrandLogo size="md" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to access your favourites and scan history."
            : "Create an account to save your fridge scans and favourite recipes."}
        </p>

        <div className="mt-6 inline-flex rounded-full bg-secondary p-1">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex"
                className="mt-1 w-full rounded-2xl bg-card px-4 py-3 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-2xl bg-card px-4 py-3 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-2xl bg-card px-4 py-3 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {info && (
            <div className="rounded-2xl bg-accent p-3 text-sm text-accent-foreground">{info}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
