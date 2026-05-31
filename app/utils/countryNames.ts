import { loadCountries } from "./geo";

let nameByCode: Map<string, string> | null = null;

export const getCountryNameByCode = (countryCode: string): string => {
  if (!nameByCode) {
    nameByCode = new Map(
      loadCountries().map((c) => [String(c.id), c.properties.name]),
    );
  }
  return nameByCode.get(countryCode) ?? countryCode;
};
