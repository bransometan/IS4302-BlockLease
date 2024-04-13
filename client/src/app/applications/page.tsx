"use client";

import { UserRole } from "@/constants";
import { checkUserRole } from "@/lib/utils";
import { getRentalApplicationByTenant } from "@/services/rentalMarketplace";
import { RentalApplicationStruct, RentalPropertyStruct } from "@/types/structs";
import { useSession } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import RentalApplicationCard from "./components/RentalApplicationCard";
import { getRentalPropertyById } from "@/services/rentalProperty";
import CurrentRentalPropertyCard from "./components/CurrentRentalPropertyCard";

export default function Applications() {
  const { session } = useSession();
  const role = checkUserRole(session);
  const [currentApplication, setCurrentApplication] =
    useState<RentalApplicationStruct>();
  const [currentRentalProperty, setCurrentRentalProperty] =
    useState<RentalPropertyStruct>();

  useEffect(() => {
    const getCurrentApplicationWithRentalProperty = async () => {
      const currentApplication = await getRentalApplicationByTenant();
      setCurrentApplication(currentApplication);
      if (currentApplication) {
        const rentalProperty = await getRentalPropertyById(
          currentApplication.rentalPropertyId
        );
        setCurrentRentalProperty(rentalProperty);
      }
    };
    getCurrentApplicationWithRentalProperty();
  }, []);

  // Page is only for tenants to access
  if (role !== UserRole.Tenant) return;

  return (
    <div className="space-y-4">
      <h1 className="font-bold">My Applications</h1>
      <div className="space-y-4">
        {currentApplication ? (
          <>
            <RentalApplicationCard
              rentalApplication={currentApplication}
              rentalProperty={currentRentalProperty!}
            />
            <h1 className="font-bold">Rental Property Details</h1>
            <CurrentRentalPropertyCard
              rentalProperty={currentRentalProperty!}
            />
          </>
        ) : (
          <p>You do not have any applications</p>
        )}
      </div>
    </div>
  );
}
