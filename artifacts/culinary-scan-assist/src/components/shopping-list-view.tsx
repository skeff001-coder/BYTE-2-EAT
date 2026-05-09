import { useState } from "react";
import type { ShoppingItem } from "@/lib/analyze-fridge";
import { ShoppingCart, Check } from "lucide-react";

interface Props {
  items: ShoppingItem[];
}

const AISLE_COLORS: Record<string, string> = {
  Dairy:    "bg-blue-50 text-blue-700 ring-blue-200",
  Produce:  "bg-green-50 text-green-700 ring-green-200",
  Meat:     "bg-red-50 text-red-700 ring-red-200",
  Bakery:   "bg-amber-50 text-amber-700 ring-amber-200",
  Frozen:   "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Pantry:   "bg-orange-50 text-orange-700 ring-orange-200",
  default:  "bg-secondary text-secondary-foreground ring-border",
};

function aisleColor(aisle: string) {
  return AISLE_COLORS[aisle] ?? AISLE_COLORS.default;
}

function groupByAisle(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.aisle || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function ShoppingListView({ items }: Props) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  if (!items.length) return null;

  const toggle = (item: string) =>
    setTicked((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });

  const total = items.reduce((s, i) => s + (i.cost ?? 0), 0);
  const grouped = groupByAisle(items);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{items.length} items to buy</span>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          ~£{total.toFixed(2)} est.
        </span>
      </div>

      {Object.entries(grouped).map(([aisle, aisleItems]) => (
        <div key={aisle}>
          <p className={`mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${aisleColor(aisle)}`}>
            {aisle}
          </p>
          <div className="space-y-2">
            {aisleItems.map((item) => {
              const done = ticked.has(item.item);
              return (
                <button
                  key={item.item}
                  onClick={() => toggle(item.item)}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border text-left transition-opacity ${done ? "opacity-50" : ""}`}
                >
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ring-1 ${done ? "bg-primary ring-primary" : "ring-border"}`}>
                    {done && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                  <span className={`flex-1 text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.item}
                  </span>
                  {item.cost > 0 && (
                    <span className="text-xs text-muted-foreground">~£{item.cost.toFixed(2)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-center text-[11px] text-muted-foreground">Tap items to check them off as you shop</p>
    </div>
  );
}
