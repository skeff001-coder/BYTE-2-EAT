import { Clock, Users, Flame, X, CheckCircle2 } from "lucide-react";
import type { Recipe } from "@/lib/recipes";

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-t-3xl bg-background pb-8 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-52 w-full flex-shrink-0">
          <img
                        src={recipe.image || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"}
            alt={recipe.title}
            className="h-full w-full object-cover rounded-t-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-3xl" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              {recipe.tag}
            </span>
            <h2 className="mt-1 text-xl font-bold text-white leading-tight">{recipe.title}</h2>
          </div>
        </div>

        <div className="px-5 pt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {recipe.time}
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              {recipe.calories} kcal
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
            </span>
            <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              {recipe.difficulty}
            </span>
          </div>

          <div className="mt-5">
            <h3 className="text-base font-bold text-foreground mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                    {i + 1}
                  </span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <h3 className="text-base font-bold text-foreground mb-3">Method</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
