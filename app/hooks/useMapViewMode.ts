"use client";

import {
  getServerMapViewMode,
  MapViewMode,
  readMapViewMode,
  subscribeMapViewMode,
  writeMapViewMode,
} from "@/app/utils/mapViewMode";
import { useCallback, useSyncExternalStore } from "react";

/** Client preference for flat map vs read-only globe. */
export const useMapViewMode = (): {
  mode: MapViewMode;
  setMode: (mode: MapViewMode) => void;
} => {
  const mode = useSyncExternalStore(
    subscribeMapViewMode,
    readMapViewMode,
    getServerMapViewMode,
  );

  const setMode = useCallback((next: MapViewMode) => {
    writeMapViewMode(next);
  }, []);

  return { mode, setMode };
};
