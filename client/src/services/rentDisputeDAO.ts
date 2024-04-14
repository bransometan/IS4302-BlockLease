import { DisputeStatus, DisputeType, RentDisputeStruct } from "@/types/structs";
import { DeployedContract, getContract } from "./contractFactory";
import { getBalance } from "./leaseToken";
import { enumValueToIndex } from "@/lib/utils";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const createRentDispute = async (
  rentalPropertyId: number,
  applicationId: number,
  disputeType: DisputeType,
  disputeReason: string
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  try {
    const rentDisputeDAOContract = await getContract(
      DeployedContract.RentDisputeDAOContract
    );
    const tx = await rentDisputeDAOContract.createRentDispute(
      rentalPropertyId,
      applicationId,
      enumValueToIndex(DisputeType, disputeType), // Index required on solidity end
      disputeReason
    );
    await tx.wait();
    await getBalance(); // due to stake of voter rewards by payment escrow
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getDisputesByTenant = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  try {
    const rentDisputeDAOContract = await getContract(
      DeployedContract.RentDisputeDAOContract
    );
    const rentDisputes: RentDisputeStruct[] =
      await rentDisputeDAOContract.getDisputesByTenant(accounts?.[0]);
    return rentDisputes.map((dispute) => _structureRentDispute(dispute));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const _structureRentDispute = (
  rentDispute: RentDisputeStruct
): RentDisputeStruct => {
  // Solidity end returns BigNumber, so need convert to Number
  // Soldity enum returns BigNumber, so need convert
  // Solidity timestamp is in s, Date is in ms
  return {
    rentDisputeId: Number(rentDispute.rentDisputeId),
    rentalPropertyId: Number(rentDispute.rentalPropertyId),
    applicationId: Number(rentDispute.applicationId),
    tenantAddress: rentDispute.tenantAddress,
    landlordAddress: rentDispute.landlordAddress,
    startTime: new Date(Number(rentDispute.startTime) * 1000),
    endTime: new Date(Number(rentDispute.endTime) * 1000),
    status: Object.values(DisputeStatus)[Number(rentDispute.status)],
    disputeType: Object.values(DisputeType)[Number(rentDispute.disputeType)],
    disputeReason: rentDispute.disputeReason,
  };
};
