import { RentStatus, RentalApplicationStruct } from "@/types/structs";
import { DeployedContract, getContract } from "./contractFactory";
import { getBalance } from "./leaseToken";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const listRentalProperty = async (
  rentalPropertyId: number,
  depositFee: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalMarketplaceContract = await getContract(
      DeployedContract.RentalMarketplaceContract
    );
    const tx = await rentalMarketplaceContract.listARentalProperty(
      rentalPropertyId,
      depositFee
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const applyRentalProperty = async (
  rentalPropertyId: number,
  tenantName: string,
  tenantEmail: string,
  tenantPhone: string,
  description: string
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalMarketplaceContract = await getContract(
      DeployedContract.RentalMarketplaceContract
    );
    const tx = await rentalMarketplaceContract.applyRentalProperty(
      rentalPropertyId,
      tenantName,
      tenantEmail,
      tenantPhone,
      description
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getRentalApplicationByTenant = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  try {
    const rentalMarketplaceContract = await getContract(
      DeployedContract.RentalMarketplaceContract
    );
    let rentalApplication: RentalApplicationStruct =
      await rentalMarketplaceContract.getRentalApplicationByTenant(
        accounts?.[0]
      );
    rentalApplication = _structureRentalApplication(rentalApplication);
    // As Solidity cannot return nothing, returned an empty rentalApplication to signify
    if (rentalApplication.paymentIds.length != 0) {
      return rentalApplication;
    }
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * Usable by BOTH tenant or landlord
 * @param rentalPropertyId
 * @param applicationId
 * @returns
 */
export const cancelOrRejectRentalApplication = async (
  rentalPropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalMarketplaceContract = await getContract(
      DeployedContract.RentalMarketplaceContract
    );
    const tx = await rentalMarketplaceContract.cancelOrRejectRentalApplication(
      rentalPropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since the tenant will be refunded the deposit (LeaseToken)
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getAllRentalApplicationsByRentalPropertyId = async (
  rentalPropertyId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalMarketplaceContract = await getContract(
      DeployedContract.RentalMarketplaceContract
    );
    const rentalApplications: RentalApplicationStruct[] =
      await rentalMarketplaceContract.getAllRentalApplicationsFromRentalProperty(
        rentalPropertyId
      );
    return rentalApplications.map((application) =>
      _structureRentalApplication(application)
    );
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const acceptRentalApplication = async (
  rentalPropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalMarketplaceContract = await getContract(
      DeployedContract.RentalMarketplaceContract
    );
    const tx = await rentalMarketplaceContract.acceptRentalApplication(
      rentalPropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since the deposit by tenant is released to landlord
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const _structureRentalApplication = (
  rentalApplication: any
): RentalApplicationStruct => {
  // Solidity end returns BigNumber, so need convert to Number
  // Soldity enum returns BigNumber, so need convert
  return {
    rentalPropertyId: Number(rentalApplication.rentalPropertyId),
    applicationId: Number(rentalApplication.applicationId),
    landlordAddress: rentalApplication.landlordAddress,
    tenantAddress: rentalApplication.tenantAddress,
    tenantName: rentalApplication.tenantName,
    tenantEmail: rentalApplication.tenantEmail,
    tenantPhone: rentalApplication.tenantPhone,
    description: rentalApplication.description,
    monthsPaid: Number(rentalApplication.monthsPaid),
    status: Object.values(RentStatus)[Number(rentalApplication.status)],
    paymentIds: rentalApplication.paymentIds.map((id: BigInt) => Number(id)),
  };
};
