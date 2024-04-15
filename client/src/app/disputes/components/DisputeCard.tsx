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
import { DisputeStatus, RentDisputeStruct } from "@/types/structs";
import { CircleEllipsis } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { checkUserRole, formatDateForDispute, truncate } from "@/lib/utils";
import { useSession } from "@clerk/nextjs";
import { UserRole } from "@/constants";
import VoteForm from "./VoteForm";
import { useEffect, useState } from "react";
import { getNumVotersInDispute } from "@/services/rentDisputeDAO";

const RentalApplicationActionsDropdown = ({
  disputeId,
}: {
  disputeId: number;
}) => {
  return (
    <Popover>
      <PopoverTrigger className="absolute right-1 top-1">
        <CircleEllipsis color="gray" />
      </PopoverTrigger>
      <PopoverContent className="text-sm absolute right-0 top-0 w-[100px]">
        <div>
          <ul className="space-y-1">
            <VoteForm disputeId={disputeId} />
          </ul>
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
  const { session } = useSession();
  const role = checkUserRole(session);
  const [numVoters, setNumVoters] = useState<number>();

  useEffect(() => {
    const getNumVoters = async () => {
      const numVoters = await getNumVotersInDispute(rentDispute.rentDisputeId);
      setNumVoters(numVoters);
    };
    getNumVoters();
  }, []);

  return (
    <Card>
      <CardHeader className="font-bold relative">
        {role === UserRole.Validator &&
          rentDispute.status === DisputeStatus.PENDING && (
            <RentalApplicationActionsDropdown
              disputeId={rentDispute.rentDisputeId}
            />
          )}
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
        <div>
          <p>
            Current number of voters: <b>{numVoters}/2</b>
          </p>
          <p>
            Tenant Dispute Status: <b>{rentDispute.status}</b>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
