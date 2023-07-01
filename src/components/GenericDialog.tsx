import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  closeModal: () => void;
  // openModal: () => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  closeButtonText?: string;
}

export function GenericDialog({
  isOpen,
  closeModal,
  children,
  title,
  description,
  closeButtonText,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {closeButtonText && (
          <DialogFooter>
            <Button onClick={closeModal} variant="outline">
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
