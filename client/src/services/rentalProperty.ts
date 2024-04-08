import { AddRentalPropertyParams } from "@/types/services/rentalProperty";
import { DeployedContract, getContract } from "./contractFactory";
import { RentalPropertyStruct } from "@/types/contracts";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const addRentalProperty = async (data: AddRentalPropertyParams) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamas not installed'"));
  }

  try {
    const rentalPropertyContract = await getContract(
      DeployedContract.RentalPropertyContract
    );
    const {
      location,
      postalCode,
      unitNumber,
      propertyType,
      description,
      numOfTenants,
      rentalPrice,
      leaseDuration,
    } = data;
    const tx = await rentalPropertyContract.addRentalProperty(
      location,
      postalCode,
      unitNumber,
      propertyType,
      description,
      numOfTenants,
      rentalPrice,
      leaseDuration
    );
    await tx.wait();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

//TODO: Post-processing needed?
export const getRentalProperty = async (
  id: string
): Promise<RentalPropertyStruct> => {
  const rentalPropertyContract = await getContract(
    DeployedContract.RentalPropertyContract
  );
  const rentalProperties = await rentalPropertyContract.getRentalProperty(id);
  return rentalProperties;
};
