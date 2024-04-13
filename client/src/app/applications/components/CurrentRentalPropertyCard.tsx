import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RentalPropertyStruct } from "@/types/structs";
import React from "react";

export default function CurrentRentalPropertyCard({
  rentalProperty,
}: {
  rentalProperty: RentalPropertyStruct;
}) {
  return (
    <Card>
      <CardHeader className="font-bold relative">
        <CardTitle>{rentalProperty.location}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p> {rentalProperty.description}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>Lease duration (months): {rentalProperty.leaseDuration}</p>
          </li>
          <li>
            <p>Postal code: {rentalProperty.postalCode}</p>
          </li>
          <li>
            <p>Property type: {rentalProperty.propertyType}</p>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <p>
          <b>{rentalProperty.rentalPrice}</b> Lease Token/month
        </p>
      </CardFooter>
    </Card>
  );
}
