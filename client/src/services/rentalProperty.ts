import { enumValueToIndex } from "@/lib/utils";
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

export interface UpdateRentalPropertyParams {
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
      enumValueToIndex(PropertyType, propertyType), // Index required on solidity end
      description,
      numOfTenants,
      rentalPrice,
      leaseDuration
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * Returns all listed rental property by landlord
 * @returns rental properties
 */
export const getListedRentalPropertiesByLandlord = async (): Promise<
  RentalPropertyStruct[]
> => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  const rentalPropertyContract = await getContract(
    DeployedContract.RentalPropertyContract
  );
  const rentalProperties: RentalPropertyStruct[] =
    await rentalPropertyContract.getLandlordListedRentalProperties(accounts[0]);
  return rentalProperties.map((rentalProperty) =>
    _structureRentalProperty(rentalProperty)
  );
};

/**
 * Returns all unlisted rental property by landlord
 * @returns rental properties
 */
export const getUnlistedRentalPropertiesByLandlord = async (): Promise<
  RentalPropertyStruct[]
> => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  const rentalPropertyContract = await getContract(
    DeployedContract.RentalPropertyContract
  );
  const rentalProperties: RentalPropertyStruct[] =
    await rentalPropertyContract.getLandlordUnlistedRentalProperties(
      accounts[0]
    );
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

export const updateRentalPropertyById = async (
  id: number,
  props: UpdateRentalPropertyParams
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
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
    } = props;

    const tx = await rentalPropertyContract.updateRentalProperty(
      id,
      location,
      postalCode,
      unitNumber,
      enumValueToIndex(PropertyType, propertyType),
      description,
      numOfTenants,
      rentalPrice,
      leaseDuration
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const deleteRentalPropertyById = async (id: number) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalPropertyContract = await getContract(
      DeployedContract.RentalPropertyContract
    );
    const tx = await rentalPropertyContract.deleteRentalProperty(id);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getAllListedRentalProperties = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const rentalPropertyContract = await getContract(
      DeployedContract.RentalPropertyContract
    );
    const listedRentalProperties: RentalPropertyStruct[] =
      await rentalPropertyContract.getAllListedRentalProperties();
    return listedRentalProperties.map((rentalProperty) =>
      _structureRentalProperty(rentalProperty)
    );
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * Process rental property for display on frontend
 * @param rentalProperty
 * @returns processed RentalProperty
 */
const _structureRentalProperty = (rentalProperty: RentalPropertyStruct) => {
  // Solidity end returns BigNumber, so need convert to Number
  return {
    rentalPropertyId: Number(rentalProperty.rentalPropertyId),
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
    paymentId: Number(rentalProperty.paymentId),
  };
};
