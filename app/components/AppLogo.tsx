import lightLogo from "@/app/assets/icons/stamped-light.svg";
import darkLogo from "@/app/assets/icons/stamped-dark.svg";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className = "h-10 w-10" }: AppLogoProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lightLogo.src}
        alt=""
        width={40}
        height={40}
        className={`${className} rounded-md shadow-sm transition-transform duration-200 group-hover:-rotate-6 dark:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={darkLogo.src}
        alt=""
        width={40}
        height={40}
        className={`${className} hidden rounded-md shadow-sm transition-transform duration-200 group-hover:-rotate-6 dark:block`}
      />
    </>
  );
}
