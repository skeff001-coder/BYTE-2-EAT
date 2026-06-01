import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, FileText, Shield, Trash2, LogOut, Info, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth, signOut } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useScanCredits } from "@/lib/use-scan-credits";
import { APP_VERSION, BUNDLE_ID, SUPPORT_EMAIL } from "@/lib/app-info";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type DeleteState = "idle" | "confirming" | "deleting" | "done";

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteState, setDeleteState] = useState<DeleteState>("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { credits, purchasePlan } = useScanCredits();
  const [scansRestored, setScansRestored] = useState(false);

  const handleRestoreScans = () => {
    purchasePlan("scan10");
    setScansRestored(true);
  };

  const handleDeleteAccount = async () => {
    setDeleteState("deleting");
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");

      await Promise.allSettled([
        supabase.from("favorites").delete().eq("user_id", session.user.id),
        supabase.from("scans").delete().eq("user_id", session.user.id),
      ]);

      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (res.status !== 503) {
          throw new Error(data.error ?? `Account deletion failed. Please contact ${SUPPORT_EMAIL}.`);
        }
      }

      await signOut();
      setDeleteState("done");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setDeleteState("confirming");
    }
  };

  if (deleteState === "done") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <Trash2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Account Deleted</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Your account and all associated data have been permanently removed. We're sorry to see you go.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-6 rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          Continue
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </header>

      <div className="px-5 space-y-5">

        {/* Account section */}
        <div className="rounded-3xl bg-card ring-1 ring-border overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
          </div>

          {user ? (
            <>
              <div className="px-5 py-3 border-b border-border">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{user.email}</p>
              </div>

              <button
                onClick={() => { void signOut(); navigate({ to: "/" }); }}
                className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium text-foreground hover:bg-accent border-b border-border transition-colors"
              >
                <LogOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                Sign Out
              </button>

              {deleteState === "idle" && (
                <button
                  onClick={() => setDeleteState("confirming")}
                  className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                  Delete Account
                </button>
              )}

              {deleteState === "confirming" && (
                <div className="px-5 py-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Are you sure?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This permanently deletes your account and all saved recipes, scan history, and favourites. This action cannot be undone.
                  </p>
                  {deleteError && (
                    <p className="text-xs text-destructive leading-relaxed">{deleteError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setDeleteState("idle"); setDeleteError(null); }}
                      className="flex-1 rounded-2xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 rounded-2xl bg-destructive py-3 text-sm font-semibold text-white"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}

              {deleteState === "deleting" && (
                <div className="flex items-center gap-3 px-5 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">Deleting your account…</p>
                </div>
              )}
            </>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-sm text-muted-foreground">Sign in to manage your account.</p>
              <Link
                to="/auth"
                className="mt-3 inline-flex rounded-2xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Legal section */}
        <div className="rounded-3xl bg-card ring-1 ring-border overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
          </div>
          <Link
            to="/legal"
            search={{ tab: "privacy" }}
            className="flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-accent border-b border-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              Privacy Policy
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/legal"
            search={{ tab: "terms" }}
            className="flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              Terms &amp; Conditions
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Health disclaimer */}
        <div className="rounded-3xl bg-amber-50 ring-1 ring-amber-200 px-5 py-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Health Disclaimer</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Health scores and dietary information in this app are for informational purposes only and do not constitute medical advice. Always consult a qualified healthcare professional.
          </p>
        </div>

        {/* Scans section */}
        <div className="rounded-3xl bg-card ring-1 ring-border overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scans</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Zap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              Scans remaining
            </div>
            <span className="text-sm font-semibold text-foreground">
              {credits}
            </span>
          </div>
          <button
            onClick={handleRestoreScans}
            disabled={scansRestored}
            className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium text-primary hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="h-4 w-4 flex-shrink-0" />
            {scansRestored ? "Purchases restored ✓" : "Restore Purchases"}
          </button>
        </div>

        {/* App Info */}
        <div className="rounded-3xl bg-card ring-1 ring-border overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              Version
            </div>
            <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-foreground">Bundle ID</span>
            <span className="text-xs text-muted-foreground font-mono">{BUNDLE_ID}</span>
          </div>
        </div>

      </div>
    </main>
  );
}
