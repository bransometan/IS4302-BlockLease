import {
  DisputeStatus,
  DisputeType,
  RentDisputeStruct,
  Vote,
} from "@/types/structs";
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
    await getBalance(); // due to stake of voter rewards to payment escrow
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * To be used by tenant to retrieve dispute made
 * @returns Rent Dispute
 */
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

/**
 * To be used by landlord to retrieve dispute made by tenant
 * @returns Rent Dispute
 */
export const getDisputesByLandlord = async () => {
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
      await rentDisputeDAOContract.getDisputesByLandlord(accounts?.[0]);
    return rentDisputes.map((dispute) => _structureRentDispute(dispute));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * For use by validators to get all disputes
 * @returns Rent Disputes
 */
export const getAllDisputes = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentDisputeDAOContract = await getContract(
      DeployedContract.RentDisputeDAOContract
    );
    const rentDisputes: RentDisputeStruct[] =
      await rentDisputeDAOContract.getAllDisputes();
    return rentDisputes.map((dispute) => _structureRentDispute(dispute));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const voteOnRentDispute = async (disputeId: number, vote: Vote) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  try {
    const rentDisputeDAOContract = await getContract(
      DeployedContract.RentDisputeDAOContract
    );
    const tx = await rentDisputeDAOContract.voteOnRentDispute(
      disputeId,
      enumValueToIndex(Vote, vote) // Index required on solidity end
    );
    await tx.wait();
    await getBalance(); // due to stake of voter price to payment escrow
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getNumVotersInDispute = async (disputeId: number) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentDisputeDAOContract = await getContract(
      DeployedContract.RentDisputeDAOContract
    );
    const numVoters = await rentDisputeDAOContract.getNumVotersInDispute(
      disputeId
    );
    return Number(numVoters);
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
