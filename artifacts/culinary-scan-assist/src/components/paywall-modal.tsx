import { Loader2, Sparkles, X, ShieldCheck, Zap } from "lucide-react";
import { useIAP, PRODUCT_SCAN1, PRODUCT_SCAN10, PRODUCT_SCAN30, type PurchasedProduct } from "@/lib/use-iap";

interface Props {
  onClose: () => void;
  onUnlock: (productId: PurchasedProduct) => void;
}

const PLANS: {
  productId: PurchasedProduct;
  label: string;
  price: string;
  scans: number;
  expiry: string;
  perScan?: string;
  badge?: string;
}[] = [
  { productId: PRODUCT_SCAN1,  label: "Single Scan Top-up",        price: "£0.99", scans: 1,  expiry: "30 days" },
  { productId: PRODUCT_SCAN10, label: "Monthly Premium 10 Scans",  price: "£4.99", scans: 10, expiry: "1 month",  badge: "Popular" },
  { productId: PRODUCT_SCAN30, label: "30 Scan Saver Pack",        price: "£11.99", scans: 30, expiry: "3 months", perScan: "Only 39p/scan", badge: "Best Value" },
];

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
          <h2 className="text-xl font-extrabold tracking-tight">Get More Scans</h2>
          <p className="mt-1 text-sm opacity-90">
            Choose a scan pack — use them before they expire.
          </p>
        </div>

        {/* Plan options */}
        {isSuccess ? (
          <div className="m-6 flex items-center justify-center gap-2 rounded-2xl py-5 text-sm font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">
            <ShieldCheck className="h-5 w-5" /> Scans added — enjoy!
          </div>
        ) : (
          <div className="px-5 pt-5 pb-2 space-y-3">
            {PLANS.map((plan) => (
              <button
                key={plan.productId}
                disabled={isBusy || !isNative}
                onClick={() => purchase(plan.productId)}
                className="relative flex w-full items-center justify-between rounded-2xl bg-card px-4 py-4 ring-1 ring-border transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {plan.badge && (
                  <span
                    className="absolute -top-2 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{plan.label}</p>
                    <p className="text-xs text-muted-foreground">{plan.scans} {plan.scans === 1 ? "scan" : "scans"} · expires in {plan.expiry}</p>
                    {plan.perScan && (
                      <p className="text-[11px] font-semibold text-primary mt-0.5">{plan.perScan}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <p className="text-base font-extrabold text-foreground">{plan.price}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

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
            Charged to your Apple ID at confirmation of purchase. Scan packs are one-time purchases — no subscription. Single scan and 10-scan pack expire in 1 month; 30-scan pack expires in 3 months. Manage in your Apple ID Account Settings.
          </p>
        </div>

      </div>
    </div>
  );
}
