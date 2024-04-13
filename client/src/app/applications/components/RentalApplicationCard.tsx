import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RentStatus,
  RentalApplicationStruct,
  RentalPropertyStruct,
} from "@/types/structs";
import { CircleEllipsis } from "lucide-react";
import CancelRentalApplicationDialog from "./CancelRentalApplicationDialog";
import { Separator } from "@/components/ui/separator";
import { checkUserRole, truncate } from "@/lib/utils";
import { useSession } from "@clerk/nextjs";
import AcceptRentalApplicationDialog from "./AcceptRentalApplicationDialog";
import { UserRole } from "@/constants";
import MakePaymentDialog from "./MakePaymentDialog";
import AcceptPaymentDialog from "./AcceptPaymentDialog";

const RentalApplicationActionsDropdown = ({
  rentalApplication,
  rentalProperty,
}: {
  rentalApplication: RentalApplicationStruct;
  rentalProperty: RentalPropertyStruct;
}) => {
  const { session } = useSession();
  const role = checkUserRole(session);

  return (
    <Popover>
      <PopoverTrigger className="absolute right-1 top-1">
        <CircleEllipsis color="gray" />
      </PopoverTrigger>
      <PopoverContent className="text-sm absolute right-0 top-0 w-[100px]">
        <div>
          <ul className="space-y-1">
            {role === UserRole.Landlord &&
              rentalApplication.status === RentStatus.PENDING && (
                <AcceptRentalApplicationDialog
                  rentalPropertyId={rentalApplication.rentalPropertyId}
                  applicationId={rentalApplication.applicationId}
                />
              )}
            {((role === UserRole.Landlord &&
              rentalApplication.status === RentStatus.PENDING) ||
              (role === UserRole.Tenant &&
                rentalApplication.status === RentStatus.PENDING)) && (
              <CancelRentalApplicationDialog
                rentalPropertyId={rentalApplication.rentalPropertyId}
                applicationId={rentalApplication.applicationId}
              />
            )}
            {role === UserRole.Tenant &&
              rentalApplication.status === RentStatus.ONGOING && (
                <MakePaymentDialog
                  rentalProperty={rentalProperty}
                  application={rentalApplication}
                />
              )}
            {role === UserRole.Landlord &&
              rentalApplication.status === RentStatus.MADE_PAYMENT && (
                <AcceptPaymentDialog
                  rentalProperty={rentalProperty}
                  application={rentalApplication}
                />
              )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function RentalApplicationCard({
  rentalApplication,
  rentalProperty,
}: {
  rentalApplication: RentalApplicationStruct;
  rentalProperty: RentalPropertyStruct;
}) {
  return (
    <Card>
      <CardHeader className="font-bold relative">
        <RentalApplicationActionsDropdown
          rentalApplication={rentalApplication}
          rentalProperty={rentalProperty}
        />
        <CardTitle>Application Id: {rentalApplication.applicationId}</CardTitle>
        <CardTitle>
          Rental Property Id: {rentalApplication.rentalPropertyId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p> {rentalApplication.description}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>
              Landlord address:{" "}
              {truncate(rentalApplication.landlordAddress, 6, 6, 6)}
            </p>
          </li>
          <li>
            <p>Months paid: {rentalApplication.monthsPaid}</p>
          </li>
          <li>
            {rentalApplication.paymentIds.length > 0 ? (
              <p>Payments Made (ID): [{rentalApplication.paymentIds}]</p>
            ) : (
              <p>No payments made yet</p>
            )}
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <p>
          Payment Status: <b>{rentalApplication.status}</b>
        </p>
      </CardFooter>
    </Card>
  );
}
