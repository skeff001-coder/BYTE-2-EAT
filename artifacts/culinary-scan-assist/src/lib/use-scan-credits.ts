import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY        = "bite_scan_credits";
const STORAGE_EXPIRY_KEY = "bite_scan_expiry";

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function readCredits(): number {
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
  if (expiry && new Date(expiry) < new Date()) {
    localStorage.setItem(STORAGE_KEY, "0");
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
    return 0;
  }
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === null) {
    localStorage.setItem(STORAGE_KEY, "1");
    return 1;
  }
  return Number(val);
}

function writeCredits(n: number) {
  localStorage.setItem(STORAGE_KEY, String(n));
}

export type ScanPlan = "scan1" | "scan10" | "scan30";

export async function syncCreditsForUser(userId: string): Promise<void> {
  try {
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) > 0) {
      const current = Number(localStorage.getItem("bite_scan_credits") ?? "1");
      if (current === 1) {
        localStorage.setItem("bite_scan_credits", "0");
      }
    }
  } catch {
    // non-critical — silently ignore
  }
}

export const PLAN_CREDITS: Record<ScanPlan, number> = {
  scan1:  1,
  scan10: 10,
  scan30: 30,
};

const PLAN_EXPIRY_DAYS: Record<ScanPlan, number> = {
  scan1:  30,
  scan10: 30,
  scan30: 90,
};

export function useScanCredits() {
  const [credits, setCredits] = useState<number>(() => readCredits());

  const canScan = credits > 0;

  const consumeCredit = useCallback(() => {
    const c = readCredits();
    if (c <= 0) return;
    const next = Math.max(0, c - 1);
    writeCredits(next);
    setCredits(next);
  }, []);

  const purchasePlan = useCallback((plan: ScanPlan) => {
    const toAdd = PLAN_CREDITS[plan];
    const c = readCredits();
    const next = c + toAdd;
    writeCredits(next);
    const expiryDays = PLAN_EXPIRY_DAYS[plan];
    localStorage.setItem(STORAGE_EXPIRY_KEY, addDays(expiryDays));
    setCredits(next);
  }, []);

  return { credits, canScan, consumeCredit, purchasePlan };
}
