import { useState } from "react";
import { X, Zap, Infinity, Star } from "lucide-react";

type Plan = "pack5" | "monthly" | "yearly";

interface Props {
  onClose: () => void;
  onPurchase: (plan: Plan) => void;
}

export function PaywallModal({ onClose, onPurchase }: Props) {
  const [purchasing, setPurchasing] = useState<Plan | null>(null);
  const [purchased, setPurchased] = useState<Plan | null>(null);

  const handlePurchase = async (plan: Plan) => {
    setPurchasing(plan);
    await new Promise((r) => setTimeout(r, 900));
    onPurchase(plan);
    setPurchased(plan);
    setPurchasing(null);
    setTimeout(onClose, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl bg-background shadow-2xl overflow-hidden">
        <div
          className="relative flex flex-col items-center px-6 pt-8 pb-6 text-primary-foreground text-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 mb-3">
            <Zap className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Unlock More Scans</h2>
          <p className="mt-1 text-sm opacity-90">
            You've used your free trial scan. Choose a plan to keep cooking smarter.
          </p>
        </div>

        <div className="px-5 py-5 space-y-3">
          <PlanCard
            plan="pack5"
            icon={<Zap className="h-5 w-5 text-primary" />}
            label="5 Scans"
            sublabel="One-time top-up"
            price="$4.99"
            purchasing={purchasing}
            purchased={purchased}
            onSelect={handlePurchase}
          />

          <PlanCard
            plan="monthly"
            icon={<Infinity className="h-5 w-5 text-primary" />}
            label="Unlimited Monthly"
            sublabel="Billed every month"
            price="$9.99 / mo"
            purchasing={purchasing}
            purchased={purchased}
            onSelect={handlePurchase}
          />

          <PlanCard
            plan="yearly"
            icon={<Star className="h-5 w-5" style={{ color: "#b8860b" }} />}
            label="Unlimited Yearly"
            sublabel="Billed once a year"
            price="$23.99 / yr"
            purchasing={purchasing}
            purchased={purchased}
            onSelect={handlePurchase}
            featured
          />
        </div>

        <p className="pb-5 text-center text-[11px] text-muted-foreground px-6">
          Payment processed securely. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  price: string;
  purchasing: Plan | null;
  purchased: Plan | null;
  onSelect: (plan: Plan) => void;
  featured?: boolean;
}

function PlanCard({ plan, icon, label, sublabel, price, purchasing, purchased, onSelect, featured }: PlanCardProps) {
  const isLoading = purchasing === plan;
  const isDone = purchased === plan;
  const isDisabled = purchasing !== null;

  return (
    <div
      className="relative rounded-2xl p-[2px]"
      style={featured ? { background: "linear-gradient(135deg, #d4af37, #f5d060, #b8860b)" } : undefined}
    >
      <div
        className={`relative rounded-[14px] bg-card px-4 py-3.5 ring-1 ${featured ? "ring-0" : "ring-border"}`}
      >
        {featured && (
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
            style={{ background: "linear-gradient(90deg, #d4af37, #b8860b)" }}
          >
            ⭐ Best Value · Save 80%
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={featured ? { background: "linear-gradient(135deg, #fef9e7, #fde68a)" } : undefined}
            {...(!featured ? { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent" } : {})}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground text-sm">{label}</div>
            <div className="text-xs text-muted-foreground">{sublabel}</div>
          </div>
          <div className="text-right">
            <div className={`font-bold text-base ${featured ? "" : "text-foreground"}`} style={featured ? { color: "#b8860b" } : undefined}>
              {price}
            </div>
          </div>
        </div>

        <button
          onClick={() => !isDisabled && onSelect(plan)}
          disabled={isDisabled}
          className={`mt-3 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-60 ${
            featured
              ? "text-white"
              : "text-primary-foreground"
          }`}
          style={
            featured
              ? { background: "linear-gradient(90deg, #d4af37, #b8860b)" }
              : { background: "var(--gradient-primary)" }
          }
        >
          {isDone ? "✓ Unlocked!" : isLoading ? "Processing…" : featured ? "Get Best Value" : "Choose Plan"}
        </button>
      </div>
    </div>
  );
}
