"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayPickerProps,
} from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: cn(defaults.root, "text-sm"),
        months: cn(defaults.months, "flex flex-col sm:flex-row gap-4"),
        month: cn(defaults.month, "flex flex-col gap-3"),
        month_caption: cn(
          defaults.month_caption,
          "flex items-center justify-center h-9 px-9 relative",
        ),
        caption_label: cn(
          defaults.caption_label,
          "text-sm font-semibold text-foreground",
        ),
        nav: cn(defaults.nav, "absolute inset-x-0 top-0 flex justify-between"),
        button_previous: cn(
          defaults.button_previous,
          "inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-transparent text-foreground/70 hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        ),
        button_next: cn(
          defaults.button_next,
          "inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-transparent text-foreground/70 hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        ),
        month_grid: cn(defaults.month_grid, "w-full border-collapse"),
        weekdays: cn(defaults.weekdays, "flex"),
        weekday: cn(
          defaults.weekday,
          "w-9 text-[0.7rem] font-medium text-muted-foreground uppercase tracking-wide",
        ),
        week: cn(defaults.week, "flex w-full mt-1"),
        day: cn(defaults.day, "relative h-9 w-9 p-0 text-center align-middle"),
        day_button: cn(
          defaults.day_button,
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:opacity-30 disabled:pointer-events-none",
        ),
        selected: cn(
          defaults.selected,
          "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground [&_button]:font-semibold",
        ),
        today: cn(
          defaults.today,
          "[&_button]:ring-1 [&_button]:ring-inset [&_button]:ring-primary/40",
        ),
        outside: cn(defaults.outside, "[&_button]:text-muted-foreground/50"),
        disabled: cn(defaults.disabled, "[&_button]:opacity-30"),
        hidden: cn(defaults.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="h-4 w-4" {...rest} />
          ) : (
            <ChevronRightIcon className="h-4 w-4" {...rest} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
