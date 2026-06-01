import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cancelExpiryNotification, scheduleExpiryNotification } from "./scan-expiry-notification";

const STORAGE_KEY        = "bite_scan_credits";
const STORAGE_EXPIRY_KEY = "bite_scan_expiry";
const CREDITS_CHANGED    = "bite_credits_changed";

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
    void cancelExpiryNotification();
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

export type ScanPlan = "scan1" | "scan10";

export async function syncCreditsForUser(userId: string): Promise<void> {
  try {
    const { count } = await supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const scanCount = count ?? 0;
    const current = Number(localStorage.getItem(STORAGE_KEY) ?? "-1");

    let changed = false;
    if (scanCount === 0 && current <= 0) {
      // Brand-new account with no scans — ensure they get their 1 free scan
      localStorage.setItem(STORAGE_KEY, "1");
      changed = true;
    } else if (scanCount > 0 && current === 1) {
      // Returning user still showing 1 credit — they already used their free scan
      // on a previous session/device; zero it out to prevent double-dipping
      localStorage.setItem(STORAGE_KEY, "0");
      changed = true;
    }
    if (changed) window.dispatchEvent(new Event(CREDITS_CHANGED));
  } catch {
    // non-critical — silently ignore
  }
}

export const PLAN_CREDITS: Record<ScanPlan, number> = {
  scan1:  1,
  scan10: 10,
};

const PLAN_EXPIRY_DAYS: Record<ScanPlan, number> = {
  scan1:  30,
  scan10: 30,
};

export function getDaysUntilExpiry(): number | null {
  const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
  if (!expiry) return null;
  const msLeft = new Date(expiry).getTime() - Date.now();
  if (msLeft <= 0) return null;
  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}

function readHasExpiry(): boolean {
  return localStorage.getItem(STORAGE_EXPIRY_KEY) !== null;
}

export function useScanCredits() {
  const [credits, setCredits] = useState<number>(() => readCredits());
  const [hasExpiry, setHasExpiry] = useState<boolean>(() => readHasExpiry());

  useEffect(() => {
    const refresh = () => {
      setCredits(readCredits());
      setHasExpiry(readHasExpiry());
    };
    window.addEventListener(CREDITS_CHANGED, refresh);
    return () => window.removeEventListener(CREDITS_CHANGED, refresh);
  }, []);

  const canScan = credits > 0;

  const consumeCredit = useCallback(() => {
    const c = readCredits();
    if (c <= 0) return;
    const next = Math.max(0, c - 1);
    writeCredits(next);
    setCredits(next);
    if (next === 0) {
      void cancelExpiryNotification();
    }
  }, []);

  const purchasePlan = useCallback((plan: ScanPlan) => {
    const toAdd = PLAN_CREDITS[plan];
    const c = readCredits();
    const next = c + toAdd;
    writeCredits(next);
    const expiryDays = PLAN_EXPIRY_DAYS[plan];
    const expiryIso = addDays(expiryDays);
    localStorage.setItem(STORAGE_EXPIRY_KEY, expiryIso);
    setCredits(next);
    scheduleExpiryNotification(expiryIso);
  }, []);

  return { credits, canScan, hasExpiry, consumeCredit, purchasePlan };
}
