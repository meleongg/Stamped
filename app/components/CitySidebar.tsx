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
import { CityEntry, TravelStatus } from "../types";
import { getCountryNameByCode } from "../utils/countryNames";

interface CitySidebarProps {
  cityId: string | null;
  cityData: CityEntry | null;
  onUpdateCity: (
    cityId: string,
    updates: Partial<Pick<CityEntry, "status" | "visitedAt" | "notes">>,
  ) => void;
  onUnstampCity: (cityId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const parseDateString = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

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

export const CitySidebar: React.FC<CitySidebarProps> = ({
  cityId,
  cityData,
  onUpdateCity,
  onUnstampCity,
  onClose,
  isOpen,
}) => {
  const [notes, setNotes] = useState<string>(() => cityData?.notes ?? "");
  const [visitedAt, setVisitedAt] = useState<string>(
    () => cityData?.visitedAt ?? "",
  );
  const [status, setStatus] = useState<TravelStatus>(
    () => cityData?.status ?? "visited",
  );
  const [dateOpen, setDateOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateString(visitedAt), [visitedAt]);

  if (!isOpen || !cityId || !cityData) {
    return null;
  }

  const countryName = getCountryNameByCode(cityData.countryCode);

  const handleSave = () => {
    onUpdateCity(cityId, {
      status,
      notes: notes.trim() || undefined,
      visitedAt: status === "visited" ? visitedAt || undefined : undefined,
    });
    toast.success(`Saved · ${cityData.name}`);
  };

  const handleUnstamp = () => {
    onUnstampCity(cityId);
    toast.success(`Removed stamp · ${cityData.name}`);
  };

  const handleStatusChange = (newStatus: TravelStatus) => {
    if (newStatus === status) return;
    setStatus(newStatus);
    if (newStatus !== "visited") {
      setVisitedAt("");
    }
    onUpdateCity(cityId, {
      status: newStatus,
      visitedAt: newStatus === "visited" ? visitedAt || undefined : undefined,
    });
  };

  const handleDateSelect = (next: Date | undefined) => {
    const formatted = next ? formatDateString(next) : "";
    setVisitedAt(formatted);
    setDateOpen(false);
    onUpdateCity(cityId, { visitedAt: formatted || undefined });
  };

  return (
    <div
      id="city-sidebar"
      className="border-border bg-card fixed inset-y-0 right-0 z-50 w-80 overflow-y-auto border-l shadow-xl"
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="min-w-0">
            <h2
              className="text-foreground truncate text-xl font-bold"
              title={cityData.name}
            >
              {cityData.name}
            </h2>
            <p className="text-muted-foreground truncate text-sm">
              {countryName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex shrink-0 cursor-pointer items-center justify-center transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <Label className="mb-3">Travel Status</Label>
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

        <div className="mb-6">
          <Label className="mb-2">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSave}
            placeholder="Memories, highlights, tips..."
            className="h-32 resize-none"
          />
          <p className="text-muted-foreground mt-1.5 text-xs">
            Auto-saves when you click away.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSave} className="w-full cursor-pointer">
            Save Changes
          </Button>
          <Button
            onClick={handleUnstamp}
            className="w-full cursor-pointer"
            variant="destructive"
          >
            Remove stamp
          </Button>
        </div>
      </div>
    </div>
  );
};
