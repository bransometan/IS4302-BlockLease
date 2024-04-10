import { DeployedContract, getContract } from "./contractFactory";
import { PropertyType, RentalPropertyStruct } from "@/types/contracts";

export interface AddRentalPropertyParams {
  location: string;
  postalCode: string;
  unitNumber: string;
  propertyType: PropertyType;
  description: string;
  numOfTenants: number;
  rentalPrice: number;
  leaseDuration: number;
}

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const addRentalProperty = async (data: AddRentalPropertyParams) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed'"));
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
      Object.keys(PropertyType).indexOf(propertyType), // Index required on solidity end
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

/**
 * Returns all listed rental property by landlord
 * @param address Landlord wallet used to list property
 * @returns rental properties
 */
export const getListedRentalPropertiesByLandlord = async (
  address: string
): Promise<RentalPropertyStruct[]> => {
  const rentalPropertyContract = await getContract(
    DeployedContract.RentalPropertyContract
  );
  const rentalProperties: RentalPropertyStruct[] =
    await rentalPropertyContract.getLandlordListedRentalProperties(address);
  return rentalProperties.map((rentalProperty) =>
    _structureRentalProperty(rentalProperty)
  );
};

/**
 * Returns all unlisted rental property by landlord
 * @param address Landlord wallet used to list property
 * @returns rental properties
 */
export const getUnlistedRentalPropertiesByLandlord = async (
  address: string
): Promise<RentalPropertyStruct[]> => {
  const rentalPropertyContract = await getContract(
    DeployedContract.RentalPropertyContract
  );
  const rentalProperties: RentalPropertyStruct[] =
    await rentalPropertyContract.getLandlordUnlistedRentalProperties(address);
  return rentalProperties.map((rentalProperty) =>
    _structureRentalProperty(rentalProperty)
  );
};

/**
 * Returns a rental property
 * @param id rentalPropertyId
 * @returns rental property
 */
export const getRentalPropertyById = async (
  id: number
): Promise<RentalPropertyStruct> => {
  const rentalPropertyContract = await getContract(
    DeployedContract.RentalPropertyContract
  );
  const rentalProperty: RentalPropertyStruct =
    await rentalPropertyContract.getRentalProperty(id);
  return _structureRentalProperty(rentalProperty);
};

/**
 * Process rental property for display on frontend
 * @param rentalProperty
 * @returns processed RentalProperty
 */
const _structureRentalProperty = (rentalProperty: RentalPropertyStruct) => {
  // Solidity end returns BigNumber, so need convert to Number
  return {
    location: rentalProperty.location,
    postalCode: rentalProperty.postalCode,
    unitNumber: rentalProperty.unitNumber,
    propertyType:
      Object.values(PropertyType)[Number(rentalProperty.propertyType)],
    description: rentalProperty.description,
    numOfTenants: Number(rentalProperty.numOfTenants),
    rentalPrice: Number(rentalProperty.rentalPrice),
    leaseDuration: Number(rentalProperty.leaseDuration),
    landlord: rentalProperty.landlord,
    updateStatus: rentalProperty.updateStatus,
    isListed: rentalProperty.isListed,
    paymentId: Number(rentalProperty.paymentId).toString(),
  };
};
