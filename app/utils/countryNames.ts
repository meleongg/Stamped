import catalog from "@/public/cities/populated-places.json";
import { normalizeCountryCode } from "./countryCodes";
import { loadCountries } from "./geo";

let atlasNameByCode: Map<string, string> | null = null;
let catalogNameByCode: Map<string, string> | null = null;

const loadCatalogNameByCode = (): Map<string, string> => {
  if (catalogNameByCode) return catalogNameByCode;

  catalogNameByCode = new Map<string, string>();

  const data = catalog as {
    countryNames?: Record<string, string>;
    cities?: Array<{ countryCode: string; countryName?: string }>;
  };

  if (data.countryNames) {
    for (const [code, name] of Object.entries(data.countryNames)) {
      catalogNameByCode.set(normalizeCountryCode(code), name);
    }
  }

  for (const city of data.cities ?? []) {
    if (!city.countryName) continue;
    catalogNameByCode.set(
      normalizeCountryCode(city.countryCode),
      city.countryName,
    );
  }

  return catalogNameByCode;
};

export const getCountryNameByCode = (countryCode: string): string => {
  if (!atlasNameByCode) {
    atlasNameByCode = new Map(
      loadCountries().map((c) => [String(c.id), c.properties.name]),
    );
  }

  const normalized = normalizeCountryCode(countryCode);

  return (
    atlasNameByCode.get(normalized) ??
    atlasNameByCode.get(countryCode) ??
    loadCatalogNameByCode().get(normalized) ??
    loadCatalogNameByCode().get(countryCode) ??
    countryCode
  );
};

export const getCountryNameForCity = (city: {
  countryCode: string;
  countryName?: string;
}): string => city.countryName ?? getCountryNameByCode(city.countryCode);
