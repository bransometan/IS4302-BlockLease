import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RentDisputeStruct } from "@/types/structs";
import { CircleEllipsis } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { checkUserRole, formatDateForDispute, truncate } from "@/lib/utils";
import { useSession } from "@clerk/nextjs";

const RentalApplicationActionsDropdown = ({}: {}) => {
  const { session } = useSession();
  const role = checkUserRole(session);

  return (
    <Popover>
      <PopoverTrigger className="absolute right-1 top-1">
        <CircleEllipsis color="gray" />
      </PopoverTrigger>
      <PopoverContent className="text-sm absolute right-0 top-0 w-[100px]">
        <div>
          <ul className="space-y-1"></ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function DisputeCard({
  rentDispute,
}: {
  rentDispute: RentDisputeStruct;
}) {
  return (
    <Card>
      <CardHeader className="font-bold relative">
        <RentalApplicationActionsDropdown />
        <CardTitle>Application Id: {rentDispute.applicationId}</CardTitle>
        <CardTitle>
          Rental Property Id: {rentDispute.rentalPropertyId}
        </CardTitle>
        <CardDescription className="font-normal">
          Valid from: {formatDateForDispute(rentDispute.startTime)} -{" "}
          {formatDateForDispute(rentDispute.endTime)}
        </CardDescription>
        <CardDescription className="text-md">
          Dispute type: {rentDispute.disputeType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>Reason: {rentDispute.disputeReason}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>
              Landlord address: {truncate(rentDispute.landlordAddress, 6, 6, 6)}
            </p>
          </li>
          <li>
            <p>
              Tenant address: {truncate(rentDispute.tenantAddress, 6, 6, 6)}
            </p>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <p>
          Dispute Status: <b>{rentDispute.status}</b>
        </p>
      </CardFooter>
    </Card>
  );
}
