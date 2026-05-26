import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "bite_scan_credits";

function readCredits(): number {
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
    setCredits(next);
  }, []);

  return { credits, canScan, consumeCredit, purchasePlan };
}
