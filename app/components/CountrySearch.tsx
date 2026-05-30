"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STATUS_COLORS } from "../constants";
import { TravelStatus } from "../types";
import { CountryFeature } from "../utils/geo";

interface CountrySearchProps {
  countries: CountryFeature[];
  getCountryStatus: (countryCode: string) => TravelStatus | null;
  onSelect: (countryCode: string) => void;
  placeholder?: string;
  className?: string;
}

const MAX_RESULTS = 8;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const CountrySearch: React.FC<CountrySearchProps> = ({
  countries,
  getCountryStatus,
  onSelect,
  placeholder = "Search countries...",
  className,
}) => {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl+K focuses the input.
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      const cmd = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (cmd) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  // Dismiss when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const sorted = useMemo(() => {
    return [...countries].sort((a, b) =>
      a.properties.name.localeCompare(b.properties.name),
    );
  }, [countries]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const prefix: CountryFeature[] = [];
    const substring: CountryFeature[] = [];
    for (const c of sorted) {
      const name = normalize(c.properties.name);
      if (name.startsWith(q)) {
        prefix.push(c);
      } else if (name.includes(q)) {
        substring.push(c);
      }
      if (prefix.length + substring.length >= MAX_RESULTS * 3) break;
    }
    return [...prefix, ...substring].slice(0, MAX_RESULTS);
  }, [query, sorted]);

  const select = useCallback(
    (countryCode: string) => {
      onSelect(countryCode);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (results[highlight]) {
        e.preventDefault();
        select(String(results[highlight].id));
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-16 pl-8"
          aria-label="Search countries"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="country-search-listbox"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-9 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="border-border bg-muted text-muted-foreground absolute top-1/2 right-2 hidden h-5 -translate-y-1/2 items-center rounded border px-1.5 font-mono text-[10px] font-medium select-none sm:inline-flex">
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <ul
          id="country-search-listbox"
          role="listbox"
          className="border-border bg-card absolute z-30 mt-1 w-full overflow-hidden rounded-md border shadow-lg"
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">
              No matching country
            </li>
          ) : (
            results.map((country, i) => {
              const code = String(country.id);
              const status = getCountryStatus(code);
              const active = i === highlight;
              return (
                <li
                  key={code}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(code);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: status
                        ? STATUS_COLORS[status]
                        : "transparent",
                      border: status ? "none" : "1px solid currentColor",
                      opacity: status ? 1 : 0.3,
                    }}
                    aria-hidden
                  />
                  <span className="truncate">{country.properties.name}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
