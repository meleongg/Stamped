/**
 * ISO 3166-1 numeric (M49) → continent lookup, matching the IDs in
 * world-atlas/countries-110m.json (zero-padded 3-digit strings).
 *
 * Transcontinental countries are bucketed by their conventional UN region:
 * Russia and Turkey → Europe, Egypt → Africa, Indonesia → Asia.
 * Codes not in this map are bucketed as "Other".
 */

export type Continent =
  | "Africa"
  | "Antarctica"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America"
  | "Other";

export const CONTINENTS: Continent[] = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
];

export const TOTAL_CONTINENTS = CONTINENTS.length;

const AFRICA = [
  "012", "024", "072", "086", "108", "120", "132", "140", "148", "174",
  "175", "178", "180", "204", "226", "231", "232", "260", "262", "266",
  "270", "288", "324", "384", "404", "426", "430", "434", "450", "454",
  "466", "478", "480", "504", "508", "516", "562", "566", "624", "638",
  "646", "654", "678", "686", "690", "694", "706", "710", "716", "728",
  "729", "732", "748", "768", "788", "800", "818", "834", "854", "894",
];

const ANTARCTICA = ["010"];

const ASIA = [
  "004", "031", "048", "050", "051", "064", "096", "104", "116", "144",
  "156", "158", "196", "268", "275", "344", "356", "360", "364", "368",
  "376", "392", "398", "400", "408", "410", "414", "417", "418", "422",
  "446", "458", "462", "496", "512", "524", "586", "608", "626", "634",
  "682", "702", "704", "760", "762", "764", "784", "795", "860", "887",
];

const EUROPE = [
  "008", "020", "040", "056", "070", "100", "112", "191", "203", "208",
  "233", "234", "246", "250", "276", "292", "300", "336", "348", "352",
  "372", "380", "428", "438", "440", "442", "470", "492", "498", "499",
  "528", "578", "616", "620", "642", "643", "674", "688", "703", "705",
  "724", "752", "756", "792", "804", "807", "826",
];

const NORTH_AMERICA = [
  "028", "044", "052", "060", "084", "092", "124", "136", "188", "192",
  "212", "214", "222", "304", "308", "312", "320", "332", "340", "388",
  "474", "484", "500", "531", "535", "558", "591", "630", "659", "660",
  "662", "663", "666", "670", "780", "796", "840", "850",
];

const OCEANIA = [
  "016", "036", "090", "184", "242", "258", "296", "316", "334", "520",
  "540", "548", "554", "570", "574", "580", "583", "584", "585", "598",
  "612", "772", "776", "798", "876", "882",
];

const SOUTH_AMERICA = [
  "032", "068", "076", "152", "170", "218", "238", "254", "328", "600",
  "604", "740", "858", "862",
];

const buildMap = (): Record<string, Continent> => {
  const m: Record<string, Continent> = {};
  AFRICA.forEach((c) => (m[c] = "Africa"));
  ANTARCTICA.forEach((c) => (m[c] = "Antarctica"));
  ASIA.forEach((c) => (m[c] = "Asia"));
  EUROPE.forEach((c) => (m[c] = "Europe"));
  NORTH_AMERICA.forEach((c) => (m[c] = "North America"));
  OCEANIA.forEach((c) => (m[c] = "Oceania"));
  SOUTH_AMERICA.forEach((c) => (m[c] = "South America"));
  return m;
};

const CODE_TO_CONTINENT: Record<string, Continent> = buildMap();

export const getContinent = (countryCode: string): Continent => {
  if (CODE_TO_CONTINENT[countryCode]) return CODE_TO_CONTINENT[countryCode];
  // Try zero-padding to 3 digits in case the upstream id is "36" instead of "036".
  const padded = countryCode.padStart(3, "0");
  return CODE_TO_CONTINENT[padded] ?? "Other";
};
