"use client";

import { getRentalPropertyById } from "@/services/rentalProperty";
import {
  RentStatus,
  RentalApplicationStruct,
  RentalPropertyStruct,
} from "@/types/structs";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import MyPropertyCard from "../components/MyPropertyCard";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { getAllRentalApplicationsByRentalPropertyId } from "@/services/rentalMarketplace";
import RentalApplicationCard from "@/app/applications/components/RentalApplicationCard";

export default function RentalPropertyOverview() {
  const [rentalProperty, setRentalProperty] = useState<RentalPropertyStruct>();
  const [pendingApplications, setPendingApplications] =
    useState<RentalApplicationStruct[]>();
  const [tenants, setTenants] = useState<RentalApplicationStruct[]>();
  const params = useParams();
  const rentalPropertyId = params.propertyId as string;

  useEffect(() => {
    const getRentalPropertyInfo = async () => {
      // Rental Property details
      const rentalProperty = await getRentalPropertyById(
        Number(rentalPropertyId)
      );
      setRentalProperty(rentalProperty);

      // Applications
      const applications = await getAllRentalApplicationsByRentalPropertyId(
        Number(rentalPropertyId)
      );
      setPendingApplications(
        applications.filter((app) => app.status === RentStatus.PENDING)
      );
      setTenants(
        applications.filter((app) => app.status !== RentStatus.PENDING)
      );
    };
    getRentalPropertyInfo();
  }, []);

  if (!rentalProperty) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Link href={"/properties"}>
        <ArrowLeftIcon />
      </Link>
      <h1 className="font-bold">Overview</h1>
      <MyPropertyCard rentalProperty={rentalProperty} />
      <h1 className="font-bold">My Tenants</h1>
      {tenants && tenants.length ? (
        <div className="grid grid-cols-3 gap-4">
          {tenants.map((application) => (
            <RentalApplicationCard
              rentalApplication={application}
              rentalProperty={rentalProperty}
            />
          ))}
        </div>
      ) : (
        <p>You currently have no tenants</p>
      )}
      <h1 className="font-bold">Pending Applications</h1>
      {pendingApplications && pendingApplications.length ? (
        <div className="grid grid-cols-3 gap-4">
          {pendingApplications.map((application) => (
            <RentalApplicationCard
              rentalApplication={application}
              rentalProperty={rentalProperty}
            />
          ))}
        </div>
      ) : (
        <p>You currently have no pending applications</p>
      )}
    </div>
  );
}
