import { useState, useCallback } from "react";

const STORAGE_KEY = "bite_scan_credits";

function readCredits(): number {
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === null) {
    localStorage.setItem(STORAGE_KEY, "3");
    return 3;
  }
  return Number(val);
}

function writeCredits(n: number) {
  localStorage.setItem(STORAGE_KEY, String(n));
}

export function useScanCredits() {
  const [credits, setCredits] = useState<number>(() => readCredits());

  const canScan = credits === -1 || credits > 0;

  const consumeCredit = useCallback(() => {
    const c = readCredits();
    if (c === -1) return;
    const next = Math.max(0, c - 1);
    writeCredits(next);
    setCredits(next);
  }, []);

  const purchasePlan = useCallback((plan: "pack5" | "monthly" | "yearly") => {
    if (plan === "pack5") {
      const c = readCredits();
      const next = c === -1 ? -1 : c + 5;
      writeCredits(next);
      setCredits(next);
    } else {
      writeCredits(-1);
      setCredits(-1);
    }
  }, []);

  return { credits, canScan, consumeCredit, purchasePlan };
}
