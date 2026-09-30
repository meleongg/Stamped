import { STORAGE_KEYS } from "@/app/constants";

export type MapViewMode = "flat" | "globe";

export const DEFAULT_MAP_VIEW_MODE: MapViewMode = "flat";

export const isMapViewMode = (value: unknown): value is MapViewMode =>
  value === "flat" || value === "globe";

const listeners = new Set<() => void>();

const emit = (): void => {
  for (const listener of listeners) listener();
};

export const subscribeMapViewMode = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.MAP_VIEW_MODE) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(listener);
  };
};

export const readMapViewMode = (): MapViewMode => {
  if (typeof window === "undefined") return DEFAULT_MAP_VIEW_MODE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.MAP_VIEW_MODE);
    return isMapViewMode(raw) ? raw : DEFAULT_MAP_VIEW_MODE;
  } catch {
    return DEFAULT_MAP_VIEW_MODE;
  }
};

export const writeMapViewMode = (mode: MapViewMode): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.MAP_VIEW_MODE, mode);
    emit();
  } catch {
    // Ignore quota / private-mode failures; preference is best-effort.
  }
};

export const getServerMapViewMode = (): MapViewMode => DEFAULT_MAP_VIEW_MODE;
