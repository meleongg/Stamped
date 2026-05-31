/** ISO 3166-1 numeric codes: world-atlas uses zero-padded strings; city catalog may omit leading zeros. */
export const normalizeCountryCode = (code: string): string => {
  const trimmed = String(code).trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(3, "0");
  }
  return trimmed;
};

export const countryCodesMatch = (a: string, b: string): boolean =>
  normalizeCountryCode(a) === normalizeCountryCode(b);
