import { useState, useCallback } from "react";

const TOTAL_KEY = "bite_savings_total";
const MONTH_KEY = "bite_savings_month";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function readMonthly(): number {
  const stored = localStorage.getItem(MONTH_KEY);
  if (!stored) return 0;
  try {
    const { month, total } = JSON.parse(stored) as { month: string; total: number };
    return month === currentMonth() ? total : 0;
  } catch {
    return 0;
  }
}

function readAllTime(): number {
  return Number(localStorage.getItem(TOTAL_KEY) ?? "0");
}

export function useSavingsTracker() {
  const [monthly, setMonthly] = useState<number>(readMonthly);
  const [allTime, setAllTime] = useState<number>(readAllTime);

  const addSavings = useCallback((amount: number) => {
    if (!amount || amount <= 0) return;

    const newMonthly = readMonthly() + amount;
    localStorage.setItem(MONTH_KEY, JSON.stringify({ month: currentMonth(), total: newMonthly }));
    setMonthly(newMonthly);

    const newAllTime = readAllTime() + amount;
    localStorage.setItem(TOTAL_KEY, String(newAllTime));
    setAllTime(newAllTime);
  }, []);

  return { monthly, allTime, addSavings };
}
