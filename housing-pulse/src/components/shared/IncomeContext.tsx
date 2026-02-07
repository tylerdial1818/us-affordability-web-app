"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface IncomeContextValue {
  income: number | null;
  setIncome: (income: number | null) => void;
  affordablePrice: number | null;
  monthlyBudget: number | null;
  hasIncome: boolean;
}

const IncomeContext = createContext<IncomeContextValue>({
  income: null,
  setIncome: () => {},
  affordablePrice: null,
  monthlyBudget: null,
  hasIncome: false,
});

export function IncomeProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [income, setIncomeState] = useState<number | null>(null);

  // Initialize from URL param or localStorage
  useEffect(() => {
    const urlIncome = searchParams.get("income");
    if (urlIncome) {
      const parsed = parseInt(urlIncome, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setIncomeState(parsed);
        return;
      }
    }
    // Fallback to localStorage
    const stored = localStorage.getItem("housingpulse_income");
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setIncomeState(parsed);
      }
    }
  }, [searchParams]);

  const setIncome = useCallback(
    (newIncome: number | null) => {
      setIncomeState(newIncome);
      if (newIncome) {
        localStorage.setItem("housingpulse_income", String(newIncome));
        // Update URL param
        const params = new URLSearchParams(searchParams.toString());
        params.set("income", String(newIncome));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        localStorage.removeItem("housingpulse_income");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("income");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    },
    [searchParams, router, pathname]
  );

  const affordablePrice = income ? Math.round(income * 3) : null;
  const monthlyBudget = income ? Math.round(income / 12) : null;

  return (
    <IncomeContext.Provider
      value={{
        income,
        setIncome,
        affordablePrice,
        monthlyBudget,
        hasIncome: income !== null && income > 0,
      }}
    >
      {children}
    </IncomeContext.Provider>
  );
}

export function useIncome() {
  return useContext(IncomeContext);
}
