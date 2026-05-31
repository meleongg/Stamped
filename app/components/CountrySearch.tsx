"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_COLORS } from "../constants";
import { CityCatalogEntry, TravelStatus } from "../types";
import { normalizeSearch, searchCityCatalog } from "../utils/cities";
import { getCountryNameByCode } from "../utils/countryNames";
import { CountryFeature } from "../utils/geo";

interface CountrySearchProps {
  countries: CountryFeature[];
  getCountryStatus: (countryCode: string) => TravelStatus | null;
  isCityStamped?: (cityId: string) => boolean;
  onSelectCountry: (countryCode: string) => void;
  onSelectCity?: (city: CityCatalogEntry) => void;
  placeholder?: string;
  className?: string;
}

const MAX_RESULTS = 8;

type SearchResult =
  | { type: "country"; country: CountryFeature }
  | { type: "city"; city: CityCatalogEntry };

export const CountrySearch: React.FC<CountrySearchProps> = ({
  countries,
  getCountryStatus,
  isCityStamped,
  onSelectCountry,
  onSelectCity,
  placeholder = "Search countries & cities...",
  className,
}) => {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) =>
      a.properties.name.localeCompare(b.properties.name),
    );
  }, [countries]);

  const results = useMemo((): SearchResult[] => {
    const q = normalizeSearch(query.trim());
    if (!q) return [];

    const countryResults: SearchResult[] = [];
    const prefix: CountryFeature[] = [];
    const substring: CountryFeature[] = [];

    for (const c of sortedCountries) {
      const name = normalizeSearch(c.properties.name);
      if (name.startsWith(q)) prefix.push(c);
      else if (name.includes(q)) substring.push(c);
      if (prefix.length + substring.length >= MAX_RESULTS) break;
    }

    for (const c of [...prefix, ...substring].slice(0, 4)) {
      countryResults.push({ type: "country", country: c });
    }

    const cityResults: SearchResult[] = searchCityCatalog(q, 4).map((city) => ({
      type: "city",
      city,
    }));

    return [...countryResults, ...cityResults].slice(0, MAX_RESULTS);
  }, [query, sortedCountries]);

  const applyPick = (result: SearchResult) => {
    if (result.type === "country") {
      onSelectCountry(String(result.country.id));
    } else if (onSelectCity) {
      onSelectCity(result.city);
    }
    setQuery("");
    setOpen(false);
  };

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
        applyPick(results[highlight]);
        inputRef.current?.blur();
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
          aria-label="Search countries and cities"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="place-search-listbox"
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
          id="place-search-listbox"
          role="listbox"
          className="border-border bg-card absolute z-30 mt-1 w-full overflow-hidden rounded-md border shadow-lg"
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">
              No matching places
            </li>
          ) : (
            results.map((result, i) => {
              const active = i === highlight;
              if (result.type === "country") {
                const code = String(result.country.id);
                const status = getCountryStatus(code);
                return (
                  <li
                    key={`c-${code}`}
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyPick(result);
                      inputRef.current?.blur();
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
                    <span className="truncate">
                      {result.country.properties.name}
                    </span>
                  </li>
                );
              }

              const { city } = result;
              const stamped = isCityStamped?.(city.id);
              return (
                <li
                  key={`city-${city.id}`}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyPick(result);
                    inputRef.current?.blur();
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
                      backgroundColor: stamped ? "#0284c7" : "transparent",
                      border: stamped ? "none" : "1px solid currentColor",
                      opacity: stamped ? 1 : 0.3,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    {city.name}
                    <span className="text-muted-foreground">
                      {" "}
                      · {getCountryNameByCode(city.countryCode)}
                    </span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
