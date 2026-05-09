import type { MealDay } from "@/lib/analyze-fridge";
import { Coffee, UtensilsCrossed, Moon } from "lucide-react";

interface Props {
  mealPlan: MealDay[];
}

const slotConfig = [
  { key: "breakfast" as const, label: "Breakfast", icon: Coffee,          bg: "bg-amber-50",   text: "text-amber-700",  ring: "ring-amber-200"  },
  { key: "lunch"     as const, label: "Lunch",     icon: UtensilsCrossed, bg: "bg-green-50",   text: "text-green-700",  ring: "ring-green-200"  },
  { key: "dinner"    as const, label: "Dinner",    icon: Moon,            bg: "bg-indigo-50",  text: "text-indigo-700", ring: "ring-indigo-200" },
];

export function MealPlanView({ mealPlan }: Props) {
  if (!mealPlan.length) return null;

  return (
    <div className="space-y-4">
      {mealPlan.map((day) => (
        <div key={day.day} className="rounded-3xl bg-card p-4 ring-1 ring-border shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">{day.day}</h3>
          <div className="space-y-2">
            {slotConfig.map(({ key, label, icon: Icon, bg, text, ring }) => (
              <div key={key} className={`flex items-center gap-3 rounded-2xl ${bg} px-3 py-2 ring-1 ${ring}`}>
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-4 w-4 ${text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${text}`}>{label}</p>
                  <p className="text-sm font-medium text-foreground truncate">{day[key].title}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{day[key].time}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
