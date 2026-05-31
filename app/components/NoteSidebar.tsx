"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ACTIVE_STATUSES, STATUS_COLORS, STATUS_LABELS } from "../constants";
import { CityEntry, CountryEntry, TravelStatus } from "../types";
import { getCitiesByCountry } from "../utils/cities";

interface NoteSidebarProps {
  countryCode: string | null;
  countryName: string | null;
  countryData: CountryEntry | null;
  onUpdateCountry: (
    countryCode: string,
    updates: Partial<CountryEntry>,
  ) => void;
  onRemoveCountry: (countryCode: string) => void;
  onClose: () => void;
  isOpen: boolean;
  stampedCities?: CityEntry[];
  onStampCity?: (cityId: string) => void;
  onUnstampCity?: (cityId: string) => void;
}

// Parse a YYYY-MM-DD string into a local-time Date (no timezone surprises).
const parseDateString = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

// Format a Date back into a YYYY-MM-DD string in local time.
const formatDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateDisplay = (value: string): string => {
  const date = parseDateString(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const NoteSidebar: React.FC<NoteSidebarProps> = ({
  countryCode,
  countryName,
  countryData,
  onUpdateCountry,
  onRemoveCountry,
  onClose,
  isOpen,
  stampedCities = [],
  onStampCity,
  onUnstampCity,
}) => {
  // Parent passes key={selectedCountry}, so this component is remounted on
  // each country change. That means lazy state initializers correctly seed
  // from `countryData` once per selection with no prop->state effect.
  const [notes, setNotes] = useState<string>(() => countryData?.notes ?? "");
  const [visitedAt, setVisitedAt] = useState<string>(
    () => countryData?.visitedAt ?? "",
  );
  const [status, setStatus] = useState<TravelStatus | null>(
    () => countryData?.status ?? null,
  );
  const [dateOpen, setDateOpen] = useState(false);

  const handleSave = () => {
    if (!countryCode) return;

    const effectiveStatus = status ?? countryData?.status;
    if (!effectiveStatus) {
      toast.message("Pick a travel status to save this country");
      return;
    }

    onUpdateCountry(countryCode, {
      status: effectiveStatus,
      notes: notes.trim() || undefined,
      visitedAt: visitedAt || undefined,
    });
    toast.success(`Saved · ${countryName || countryCode.toUpperCase()}`);
  };

  const handleRemove = () => {
    if (!countryCode) return;
    onRemoveCountry(countryCode);
    toast.success(
      `Cleared status · ${countryName || countryCode.toUpperCase()}`,
    );
  };

  const handleStatusChange = (newStatus: TravelStatus) => {
    if (newStatus === status) return;
    setStatus(newStatus);
    if (countryCode) {
      onUpdateCountry(countryCode, { status: newStatus });
    }
  };

  const handleDateSelect = (next: Date | undefined) => {
    const formatted = next ? formatDateString(next) : "";
    setVisitedAt(formatted);
    setDateOpen(false);
    if (countryCode) {
      onUpdateCountry(countryCode, { visitedAt: formatted || undefined });
    }
  };

  const selectedDate = useMemo(() => parseDateString(visitedAt), [visitedAt]);

  const catalogInCountry = countryCode ? getCitiesByCountry(countryCode) : [];
  const unstampedCatalog = catalogInCountry.filter(
    (c) => !stampedCities.some((s) => s.cityId === c.id),
  );

  if (!isOpen || !countryCode) {
    return null;
  }

  const displayName = countryName || countryCode.toUpperCase();

  return (
    <div
      id="note-sidebar"
      className="border-border bg-card fixed inset-y-0 right-0 z-50 w-80 overflow-y-auto border-l shadow-xl"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-foreground truncate text-xl font-bold"
            title={displayName}
          >
            {displayName}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-center transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status Selection - single column, full width */}
        <div className="mb-6">
          <Label className="mb-3">Travel Status</Label>
          {!countryData && status === null && (
            <p className="text-muted-foreground mb-2 text-xs">
              Pick a status below, or click the country on the map to cycle.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {ACTIVE_STATUSES.map((statusValue) => {
              const label = STATUS_LABELS[statusValue];
              const isSelected = status === statusValue;
              const color = STATUS_COLORS[statusValue];
              return (
                <button
                  key={statusValue}
                  type="button"
                  onClick={() => handleStatusChange(statusValue)}
                  className={`group relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-md border-2 px-3 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground"
                  }`}
                  style={isSelected ? { borderColor: color } : undefined}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 truncate text-left">{label}</span>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 shrink-0" style={{ color }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visit Date */}
        {status === "visited" && (
          <div className="mb-6">
            <Label className="mb-2">Visit Date (Optional)</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-10 w-full cursor-pointer justify-start text-left font-normal ${
                    visitedAt ? "" : "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1 truncate">
                    {visitedAt ? formatDateDisplay(visitedAt) : "Pick a date"}
                  </span>
                  {visitedAt && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear date"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDateSelect(undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDateSelect(undefined);
                        }
                      }}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground ml-2 inline-flex items-center justify-center rounded-sm p-0.5"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                sideOffset={6}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  defaultMonth={selectedDate ?? new Date()}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <Label className="mb-2">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSave}
            placeholder="Add your thoughts, memories, or plans..."
            className="h-32 resize-none"
          />
          <p className="text-muted-foreground mt-1.5 text-xs">
            Auto-saves when you click away.
          </p>
        </div>

        {/* Cities */}
        {(stampedCities.length > 0 || unstampedCatalog.length > 0) && (
          <div className="mb-6">
            <Label className="mb-2">Cities visited</Label>
            {stampedCities.length > 0 && (
              <ul className="mb-3 space-y-1">
                {stampedCities.map((city) => (
                  <li
                    key={city.cityId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-foreground truncate">
                      {city.name}
                    </span>
                    {onUnstampCity && (
                      <button
                        type="button"
                        onClick={() => onUnstampCity(city.cityId)}
                        className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {unstampedCatalog.length > 0 && onStampCity && (
              <select
                className="border-input bg-background text-foreground w-full rounded-md border px-2 py-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    onStampCity(id);
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>
                  Add a city…
                </option>
                {unstampedCatalog.slice(0, 200).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-muted-foreground mt-1.5 text-xs">
              Zoom in on the map to see city stamps.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            className="w-full cursor-pointer"
            variant="default"
          >
            Save Changes
          </Button>

          {countryData && (
            <Button
              onClick={handleRemove}
              className="w-full cursor-pointer"
              variant="destructive"
            >
              Clear marked status
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
