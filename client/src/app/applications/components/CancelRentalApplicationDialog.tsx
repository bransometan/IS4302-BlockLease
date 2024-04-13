import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cancelOrRejectRentalApplication } from "@/services/rentalMarketplace";
import { useState } from "react";

export default function CancelRentalApplicationDialog({
  rentalPropertyId,
  applicationId,
}: {
  rentalPropertyId: number;
  applicationId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handleCancel() {
    try {
      await cancelOrRejectRentalApplication(rentalPropertyId, applicationId);
      toast({
        title: "Success",
        description: "Rental application successfully cancelled",
      });
      window.location.reload(); // Update state since application is deleted
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Oops",
        description: "Something went wrong",
      });
    } finally {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <li className="hover:bg-gray-100 hover:cursor-pointer rounded px-2">
          Cancel
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Rental Application</DialogTitle>
          <DialogDescription>
            Are you sure? This will cancel your current rental application.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleCancel}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
