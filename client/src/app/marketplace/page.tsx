"use client";

import { getAllListedRentalProperties } from "@/services/rentalProperty";
import { RentalPropertyStruct } from "@/types/structs";
import React, { useEffect, useState } from "react";
import RentalPropertyCard from "./components/RentalPropertyCard";

export default function Marketplace() {
  const [rentalProperties, setRentalProperties] =
    useState<RentalPropertyStruct[]>();

  useEffect(() => {
    const getRentalProperties = async () => {
      const rentalProperties = await getAllListedRentalProperties();
      setRentalProperties(rentalProperties);
    };
    getRentalProperties();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-bold">Marketplace</h1>
      <div className="grid grid-cols-3 gap-4">
        {rentalProperties?.map((rentalProperty, i) => {
          return <RentalPropertyCard key={i} rentalProperty={rentalProperty} />;
        })}
      </div>
    </div>
  );
}
