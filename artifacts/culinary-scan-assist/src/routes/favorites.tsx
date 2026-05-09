import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Heart, Sparkles } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites, remove } = useFavorites();
  const { user, loading } = useAuth();

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
        <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Heart className="h-5 w-5 text-primary" /> Favourites
        </h1>
      </header>

      <section className="px-5">
        {!loading && !user ? (
          <div className="mt-10 rounded-3xl bg-card p-8 text-center ring-1 ring-border">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 text-base font-semibold text-foreground">Sign in to view favourites</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a free account to save and sync your recipes.
            </p>
            <Link
              to="/auth"
              className="mt-5 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Sign in
            </Link>
          </div>
        ) : favorites.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-card p-8 text-center ring-1 ring-border">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 text-base font-semibold text-foreground">No favourites yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any recipe to save it here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Browse recipes
            </Link>
          </div>
        ) : (
          <ul className="mt-2 space-y-3">
            {favorites.map((r) => (
              <li
                key={r.key}
                className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border"
              >
                {r.image ? (
                  <img
                    src={r.image}
                    alt={r.title}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Sparkles className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {r.tag && (
                    <div className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                      {r.tag}
                    </div>
                  )}
                  <h3 className="mt-1 truncate text-base font-semibold text-foreground">{r.title}</h3>
                  {r.time && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {r.time}
                    </div>
                  )}
                  {r.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(r.key)}
                  aria-label={`Remove ${r.title} from favourites`}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Heart className="h-5 w-5 fill-current" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
