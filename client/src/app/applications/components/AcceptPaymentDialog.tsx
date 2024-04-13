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
import { acceptPayment, makePayment } from "@/services/rentalMarketplace";
import { RentalApplicationStruct, RentalPropertyStruct } from "@/types/structs";
import { useState } from "react";

export default function AcceptPaymentDialog({
  rentalProperty,
  application,
}: {
  rentalProperty: RentalPropertyStruct;
  application: RentalApplicationStruct;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handlePayment() {
    try {
      await acceptPayment(
        rentalProperty.rentalPropertyId,
        application.applicationId
      );
      toast({
        title: "Success",
        description: "Rental payment successfully accepted",
      });
      window.location.reload(); // Update state since payment accepted
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
          Accept Payment
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accept Rental Payment</DialogTitle>
          <DialogDescription>
            You will be accepting a payment of{" "}
            <b>{rentalProperty.rentalPrice} lease tokens</b>. After this you
            will have{" "}
            <b>
              {rentalProperty.leaseDuration - application.monthsPaid - 1}{" "}
              payments left
            </b>{" "}
            to receive from this tenant.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handlePayment}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
