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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { STATUS_COLORS, STATUS_LABELS } from "../constants";
import { CountryEntry, TravelStatus } from "../types";

interface NoteSidebarProps {
  countryCode: string | null;
  countryName: string | null;
  countryData: CountryEntry | null;
  onUpdateCountry: (
    countryCode: string,
    updates: Partial<CountryEntry>
  ) => void;
  onRemoveCountry: (countryCode: string) => void;
  onClose: () => void;
  isOpen: boolean;
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
}) => {
  const [notes, setNotes] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [status, setStatus] = useState<TravelStatus>("want_to_visit");
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (countryData) {
      setNotes(countryData.notes || "");
      setVisitedAt(countryData.visitedAt || "");
      setStatus(countryData.status);
    } else {
      setNotes("");
      setVisitedAt("");
      setStatus("want_to_visit");
    }
  }, [countryData]);

  const handleSave = () => {
    if (!countryCode) return;

    const updates: Partial<CountryEntry> = {
      status,
      notes: notes.trim() || undefined,
      visitedAt: visitedAt || undefined,
    };

    onUpdateCountry(countryCode, updates);
    toast.success(
      `Saved · ${countryName || countryCode.toUpperCase()}`
    );
  };

  const handleRemove = () => {
    if (!countryCode) return;
    onRemoveCountry(countryCode);
    toast.success(
      `Removed · ${countryName || countryCode.toUpperCase()}`
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

  if (!isOpen || !countryCode) {
    return null;
  }

  const displayName = countryName || countryCode.toUpperCase();

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold text-gray-900 dark:text-white truncate"
            title={displayName}
          >
            {displayName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close sidebar"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Status Selection - single column, full width */}
        <div className="mb-6">
          <Label className="mb-3">Travel Status</Label>
          <div className="flex flex-col gap-2">
            {Object.entries(STATUS_LABELS).map(([statusKey, label]) => {
              const statusValue = statusKey as TravelStatus;
              const isSelected = status === statusValue;
              const color = STATUS_COLORS[statusValue];
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => handleStatusChange(statusValue)}
                  className={`group relative flex items-center gap-3 w-full h-11 px-3 rounded-md border-2 text-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: color }
                      : undefined
                  }
                  aria-pressed={isSelected}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 text-left truncate">{label}</span>
                  {isSelected && (
                    <CheckIcon
                      className="w-4 h-4 shrink-0"
                      style={{ color }}
                    />
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
                  className={`w-full justify-start text-left font-normal h-10 cursor-pointer ${
                    visitedAt ? "" : "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1 truncate">
                    {visitedAt
                      ? formatDateDisplay(visitedAt)
                      : "Pick a date"}
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
                      className="ml-2 inline-flex items-center justify-center rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Auto-saves when you click away.
          </p>
        </div>

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
              Remove from Map
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
