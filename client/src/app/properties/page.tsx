"use client";

import React, { useEffect, useState } from "react";
import AddRentalPropertyForm from "./components/AddRentalPropertyForm";
import {
  getListedRentalPropertiesByLandlord,
  getUnlistedRentalPropertiesByLandlord,
} from "@/services/rentalProperty";
import { RentalPropertyStruct } from "@/types/contracts";
import MyPropertyCard from "./components/MyPropertyCard";

export default function MyProperties() {
  const [listedRentalProperties, setListedRentalProperties] =
    useState<RentalPropertyStruct[]>();
  const [unlistedRentalProperties, setUnlistedRentalProperties] =
    useState<RentalPropertyStruct[]>();

  useEffect(() => {
    const getRentalProperties = async () => {
      const listedRentalProperties =
        await getListedRentalPropertiesByLandlord();
      setListedRentalProperties(listedRentalProperties);
      const unlistedRentalProperties =
        await getUnlistedRentalPropertiesByLandlord();
      setUnlistedRentalProperties(unlistedRentalProperties);
    };
    getRentalProperties();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-bold">My Properties</h1>
        <AddRentalPropertyForm />
      </div>
      <div className="space-y-4">
        <h1 className="font-bold">Listed Properties</h1>
        <div className="grid grid-cols-3">
          {listedRentalProperties?.map((rentalProperty, i) => {
            return <MyPropertyCard key={i} rentalProperty={rentalProperty} />;
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="font-bold">Unlisted Properties</h1>
        <div className="grid grid-cols-3 gap-4">
          {unlistedRentalProperties?.map((rentalProperty, i) => {
            return <MyPropertyCard key={i} rentalProperty={rentalProperty} />;
          })}
        </div>
      </div>
    </div>
  );
}
