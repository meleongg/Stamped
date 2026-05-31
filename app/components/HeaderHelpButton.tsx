"use client";

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useHowToUse } from "./HowToUseProvider";

export const HeaderHelpButton: React.FC = () => {
  const { openHelp } = useHowToUse();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openHelp}
      className="cursor-pointer"
      aria-label="How to use Stamped"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
};
