import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RentalPropertyStruct } from "@/types/contracts";
import React from "react";

export default function MyPropertyCard({
  rentalProperty,
}: {
  rentalProperty: RentalPropertyStruct;
}) {
  return (
    <Card className="space-y-2">
      <CardHeader className="font-bold">
        {rentalProperty.isListed && <p>LISTED</p>}
        <div className="flex justify-between">
          <h1>{rentalProperty.location} </h1>
          <h1>{rentalProperty.rentalPrice} Lease Token</h1>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p> {rentalProperty.description}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>Lease duration (months): {rentalProperty.leaseDuration}</p>
          </li>
          <li>
            <p>Number of tenants: {rentalProperty.numOfTenants}</p>
          </li>
          <li>
            <p>Postal code: {rentalProperty.postalCode}</p>
          </li>
          <li>
            <p>Property type: {rentalProperty.propertyType}</p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
