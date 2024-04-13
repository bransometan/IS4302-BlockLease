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
import { makePayment } from "@/services/rentalMarketplace";
import { RentalApplicationStruct, RentalPropertyStruct } from "@/types/structs";
import { useState } from "react";

export default function MakePaymentDialog({
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
      await makePayment(
        rentalProperty.rentalPropertyId,
        application.applicationId
      );
      toast({
        title: "Success",
        description: "Rental payment successfully made",
      });
      window.location.reload(); // Update state since application is accepted
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
          Make Payment
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Rental Payment</DialogTitle>
          <DialogDescription>
            You will be making a payment of{" "}
            <b>{rentalProperty.rentalPrice} lease tokens</b>. After this you
            will have{" "}
            {rentalProperty.leaseDuration - application.monthsPaid - 1} payments
            left. Please note that you need to wait for the landlord to{" "}
            <b>accept payment</b> before it is reflected in the system under{" "}
            <b>Months Paid</b>
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
