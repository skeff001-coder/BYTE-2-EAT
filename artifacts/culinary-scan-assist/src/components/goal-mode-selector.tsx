import { GOAL_MODES, type GoalMode } from "@/lib/use-goal-mode";

interface Props {
  selected: GoalMode;
  onChange: (mode: GoalMode) => void;
}

export function GoalModeSelector({ selected, onChange }: Props) {
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">My Goal</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {GOAL_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-center transition-all ${
              selected === m.id
                ? "text-primary-foreground shadow-md"
                : "bg-card text-foreground ring-1 ring-border"
            }`}
            style={selected === m.id ? { background: "var(--gradient-primary)" } : undefined}
            title={m.description}
          >
            <span className="text-lg leading-none">{m.emoji}</span>
            <span className="text-[10px] font-semibold leading-tight whitespace-nowrap">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
