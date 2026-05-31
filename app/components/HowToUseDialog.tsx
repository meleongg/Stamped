"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HOW_TO_DIALOG_TITLE, HOW_TO_ITEMS } from "@/app/constants/howToUse";

interface HowToUseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: () => void;
}

export const HowToUseDialog: React.FC<HowToUseDialogProps> = ({
  open,
  onOpenChange,
  onDismiss,
}) => {
  const handleGotIt = () => {
    onDismiss?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{HOW_TO_DIALOG_TITLE}</DialogTitle>
          <DialogDescription className="sr-only">
            Quick guide to marking countries and cities on your travel map
          </DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground space-y-2.5 text-sm">
          {HOW_TO_ITEMS.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-foreground shrink-0">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleGotIt}
            className="w-full cursor-pointer sm:w-auto"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
