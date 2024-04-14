import { DisputeType, RentDisputeStruct } from "@/types/structs";
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
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};
