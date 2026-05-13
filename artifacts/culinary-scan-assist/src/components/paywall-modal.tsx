import { Loader2, Sparkles, X, Infinity, ShieldCheck, CalendarDays, ShoppingCart, Zap } from "lucide-react";
import { useIAP } from "@/lib/use-iap";

const FEATURES = [
  { icon: Infinity,      label: "Unlimited fridge scans" },
  { icon: Sparkles,      label: "AI recipe suggestions" },
  { icon: CalendarDays,  label: "Personalised meal plans" },
  { icon: ShoppingCart,  label: "Auto shopping lists" },
  { icon: Zap,           label: "Health scores & tips" },
];

interface Props {
  onClose: () => void;
  onUnlock: () => void;
}

export function PaywallModal({ onClose, onUnlock }: Props) {
  const { purchase, restore, reset, state, errorMsg, isNative } = useIAP(onUnlock);

  const isPurchasing = state === "purchasing";
  const isRestoring  = state === "restoring";
  const isSuccess    = state === "success";
  const isBusy       = isPurchasing || isRestoring;

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md rounded-3xl bg-background shadow-2xl overflow-hidden">

        {/* Header */}
        <div
          className="relative flex flex-col items-center px-6 pt-8 pb-6 text-primary-foreground text-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Unlock Byte 2 Eat Premium</h2>
          <p className="mt-1 text-sm opacity-90">
            You've used your free trial scan. Unlock unlimited access.
          </p>
        </div>

        {/* Feature list */}
        <ul className="px-6 pt-5 space-y-3">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-foreground">
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Icon className="h-4 w-4 text-primary-foreground" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        {/* Buy button */}
        <div className="px-6 pt-6 pb-2">
          {isSuccess ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">
              <ShieldCheck className="h-5 w-5" /> Premium unlocked — enjoy!
            </div>
          ) : (
            <button
              disabled={isBusy}
              onClick={purchase}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isPurchasing ? "Opening App Store…" : "Restoring…"}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isNative ? "Unlock Premium" : "Available on iOS App"}
                </>
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="px-6 pt-2 text-center text-xs text-destructive">{errorMsg}</p>
        )}

        {/* Restore + legal */}
        <div className="pb-5 pt-3 px-6 flex flex-col items-center gap-1">
          {!isSuccess && (
            <button
              onClick={restore}
              disabled={isBusy}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              Restore purchases
            </button>
          )}
          <p className="text-center text-[10px] text-muted-foreground leading-relaxed mt-1">
            Payment charged to your Apple ID account at confirmation.
            Manage or cancel subscriptions in your Account Settings.
          </p>
        </div>

      </div>
    </div>
  );
}
