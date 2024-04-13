"use client";

import { UserRole } from "@/constants";
import { checkUserRole } from "@/lib/utils";
import { getRentalApplicationByTenant } from "@/services/rentalMarketplace";
import { RentalApplicationStruct } from "@/types/structs";
import { useSession } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import RentalApplicationCard from "./components/RentalApplicationCard";

export default function Applications() {
  const { session } = useSession();
  const role = checkUserRole(session);

  const [currentApplication, setCurrentApplication] =
    useState<RentalApplicationStruct>();

  useEffect(() => {
    const getCurrentApplication = async () => {
      const currentApplication = await getRentalApplicationByTenant();
      setCurrentApplication(currentApplication);
    };
    getCurrentApplication();
  }, []);

  // Page is only for tenants to access
  if (role !== UserRole.Tenant) return;

  return (
    <div className="space-y-4">
      <h1 className="font-bold">My Applications</h1>
      <div className="grid grid-cols-3 gap-4">
        {currentApplication ? (
          <RentalApplicationCard rentalApplication={currentApplication} />
        ) : (
          <p>You do not have any applications</p>
        )}
      </div>
    </div>
  );
}
