"use client";

import React, { useEffect, useState } from "react";
import AddRentalPropertyForm from "./components/AddRentalPropertyForm";
import { getRentalProperty } from "@/services/rentalProperty";
import { RentalPropertyStruct } from "@/types/contracts";
import MyPropertyCard from "./components/MyPropertyCard";

export default function MyProperties() {
  const [rentalProperties, setRentalProperties] =
    useState<RentalPropertyStruct[]>();

  useEffect(() => {
    const getRentalProperties = async () => {
      const rentalProperty = await getRentalProperty(0); // TODO: change to all
      setRentalProperties([rentalProperty]);
    };
    getRentalProperties();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1>My Properties</h1>
        <AddRentalPropertyForm />
      </div>
      <div className="grid grid-cols-3">
        {rentalProperties?.map((rentalProperty, i) => {
          return <MyPropertyCard key={i} rentalProperty={rentalProperty} />;
        })}
      </div>
    </div>
  );
}
