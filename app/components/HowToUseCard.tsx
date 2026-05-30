"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const HOW_TO_ITEMS = [
  "Tap or search for a country to select it",
  "Click again to cycle through statuses",
  "Add notes and visit dates in the sidebar",
  "Stored on this device only. Share below the map to send a link to your phone or friends.",
] as const;

export const HowToUseCard: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-border bg-card gap-0 p-4 shadow-md">
      <CardHeader className="px-0 pb-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-foreground flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm text-left text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400"
        >
          How to Use
          <ChevronDown
            className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent className="px-0 pt-3">
          <ul className="text-muted-foreground space-y-2 text-sm">
            {HOW_TO_ITEMS.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
};
