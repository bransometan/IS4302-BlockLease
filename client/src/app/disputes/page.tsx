"use client";

import { getAllDisputes, getDisputesByTenant } from "@/services/rentDisputeDAO";
import { DisputeStatus, RentDisputeStruct } from "@/types/structs";
import React, { useEffect, useState } from "react";
import DisputeCard from "./components/DisputeCard";
import { useSession } from "@clerk/nextjs";
import { checkUserRole } from "@/lib/utils";
import { UserRole } from "@/constants";

export default function Disputes() {
  const { session } = useSession();
  const role = checkUserRole(session);
  const [pendingDisputes, setPendingDisputes] = useState<RentDisputeStruct[]>();
  const [resolvedDisputes, setResolvedDisputes] =
    useState<RentDisputeStruct[]>();

  useEffect(() => {
    const getDisputes = async () => {
      const disputes =
        role === UserRole.Tenant
          ? await getDisputesByTenant()
          : role === UserRole.Validator
          ? await getAllDisputes()
          : [];
      setPendingDisputes(
        disputes.filter((dispute) => dispute.status === DisputeStatus.PENDING)
      );
      setResolvedDisputes(
        disputes.filter((dispute) => dispute.status !== DisputeStatus.PENDING)
      );
    };
    getDisputes();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-bold">Pending disputes</h1>
      <div>
        {pendingDisputes && pendingDisputes.length > 0 ? (
          pendingDisputes.map((dispute) => (
            <DisputeCard rentDispute={dispute} />
          ))
        ) : (
          <p>You have no pending disputes</p>
        )}
      </div>
      <h1 className="font-bold">Resolved disputes</h1>
      <div className="grid grid-cols-3">
        {resolvedDisputes && resolvedDisputes.length > 0 ? (
          resolvedDisputes.map((dispute) => (
            <DisputeCard rentDispute={dispute} />
          ))
        ) : (
          <p>You have no resolved disputes</p>
        )}
      </div>
    </div>
  );
}
