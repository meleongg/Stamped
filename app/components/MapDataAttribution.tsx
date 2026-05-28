import { MAP_DATA_SOURCES } from "@/app/constants/mapAttribution";

interface MapDataAttributionProps {
  className?: string;
}

export const MapDataAttribution: React.FC<MapDataAttributionProps> = ({
  className = "",
}) => {
  return (
    <p
      className={`text-xs leading-relaxed text-gray-500 dark:text-gray-400 ${className}`}
    >
      Map boundaries and country names come from the{" "}
      <a
        href={MAP_DATA_SOURCES.naturalEarth}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
      >
        Natural Earth
      </a>{" "}
      dataset (via{" "}
      <a
        href={MAP_DATA_SOURCES.worldAtlas}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
      >
        world-atlas
      </a>
      ). They reflect that source&apos;s cartographic choices, not a political
      position by Stamped.
    </p>
  );
};
