"use client";

import { STORAGE_KEYS } from "@/app/constants";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { HowToUseDialog } from "./HowToUseDialog";

interface HowToUseContextValue {
  openHelp: () => void;
  dismissHelp: () => void;
  hasDismissedHelp: () => boolean;
}

const HowToUseContext = createContext<HowToUseContextValue | null>(null);

export const useHowToUse = (): HowToUseContextValue => {
  const ctx = useContext(HowToUseContext);
  if (!ctx) {
    throw new Error("useHowToUse must be used within HowToUseProvider");
  }
  return ctx;
};

export const HowToUseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);

  const hasDismissedHelp = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.HOW_TO_USE_DISMISSED) === "1";
  }, []);

  const dismissHelp = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.HOW_TO_USE_DISMISSED, "1");
    }
  }, []);

  const openHelp = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openHelp, dismissHelp, hasDismissedHelp }),
    [openHelp, dismissHelp, hasDismissedHelp],
  );

  return (
    <HowToUseContext.Provider value={value}>
      {children}
      <HowToUseDialog
        open={open}
        onOpenChange={setOpen}
        onDismiss={dismissHelp}
      />
    </HowToUseContext.Provider>
  );
};
