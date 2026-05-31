import { MAP_DATA_SOURCES } from "@/app/constants/mapAttribution";

interface MapDataAttributionProps {
  className?: string;
}

export const MapDataAttribution: React.FC<MapDataAttributionProps> = ({
  className = "",
}) => {
  return (
    <p className={`text-muted-foreground text-xs leading-relaxed ${className}`}>
      Map boundaries and country names come from the{" "}
      <a
        href={MAP_DATA_SOURCES.naturalEarth}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground underline underline-offset-2"
      >
        Natural Earth
      </a>{" "}
      dataset (via{" "}
      <a
        href={MAP_DATA_SOURCES.worldAtlas}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground underline underline-offset-2"
      >
        world-atlas
      </a>
      ). City names and locations come from Natural Earth&apos;s{" "}
      <a
        href={MAP_DATA_SOURCES.naturalEarthPopulatedPlaces}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground underline underline-offset-2"
      >
        Populated Places
      </a>{" "}
      dataset (a filtered subset for search and stamping). They reflect those
      sources&apos; cartographic choices, not a political position by Stamped.
    </p>
  );
};
