import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export type FavoriteRecipe = {
  key: string;
  title: string;
  time?: string;
  image?: string;
  tag?: string;
  description?: string;
  steps?: string[];
};

type Row = {
  recipe_key: string;
  title: string;
  time: string | null;
  image: string | null;
  tag: string | null;
  description: string | null;
  steps: unknown;
};

function rowToFav(r: Row): FavoriteRecipe {
  return {
    key: r.recipe_key,
    title: r.title,
    time: r.time ?? undefined,
    image: r.image ?? undefined,
    tag: r.tag ?? undefined,
    description: r.description ?? undefined,
    steps: Array.isArray(r.steps) ? (r.steps as string[]) : undefined,
  };
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const { data, error } = await supabase
      .from("favorites")
      .select("recipe_key,title,time,image,tag,description,steps")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("favorites load", error);
      return;
    }
    setFavorites((data ?? []).map((r) => rowToFav(r as Row)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (key: string) => favorites.some((f) => f.key === key),
    [favorites],
  );

  const toggle = useCallback(
    async (item: FavoriteRecipe) => {
      if (!user) return { needsAuth: true } as const;
      const exists = favorites.some((f) => f.key === item.key);
      if (exists) {
        setFavorites((prev) => prev.filter((f) => f.key !== item.key));
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_key", item.key);
        if (error) {
          console.error("favorites delete", error);
          refresh();
        }
      } else {
        setFavorites((prev) => [item, ...prev]);
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          recipe_key: item.key,
          title: item.title,
          time: item.time ?? null,
          image: item.image ?? null,
          tag: item.tag ?? null,
          description: item.description ?? null,
          steps: item.steps ?? null,
        });
        if (error) {
          console.error("favorites insert", error);
          refresh();
        }
      }
      return { needsAuth: false } as const;
    },
    [user, favorites, refresh],
  );

  const remove = useCallback(
    async (key: string) => {
      if (!user) return;
      setFavorites((prev) => prev.filter((f) => f.key !== key));
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_key", key);
      if (error) {
        console.error("favorites remove", error);
        refresh();
      }
    },
    [user, refresh],
  );

  return { favorites, isFavorite, toggle, remove, isAuthed: !!user };
}
