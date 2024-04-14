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
import {
  getDepositAmountForRentalPropertyId,
  moveOut,
} from "@/services/rentalMarketplace";
import { RentalApplicationStruct, RentalPropertyStruct } from "@/types/structs";
import { useEffect, useState } from "react";

export default function MoveOutDialog({
  rentalPropertyId,
  applicationId,
}: {
  rentalPropertyId: number;
  applicationId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [depositFee, setDepositFee] = useState<number>();

  useEffect(() => {
    const getDepositFee = async () => {
      const depositFee = await getDepositAmountForRentalPropertyId(
        rentalPropertyId
      );
      setDepositFee(depositFee);
    };
    getDepositFee();
  }, []);

  async function handleMoveOut() {
    try {
      await moveOut(rentalPropertyId, applicationId);
      toast({
        title: "Success",
        description: "Moved out of rental property successfully",
      });
      window.location.reload(); // Update state since done with stay
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

  if (!depositFee) {
    return;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <li className="hover:bg-gray-100 hover:cursor-pointer rounded px-2">
          Move Out
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move out of rental property</DialogTitle>
          <DialogDescription>
            You have completed your lease. If you have any disputes, please
            choose the <b>dipute</b> option. If not, you will be{" "}
            <b>returned the deposit fee of {depositFee} lease tokens</b> you
            have initially made. After this, you are free to rent another
            property if desired.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleMoveOut}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
