import { DeployedContract, getContract } from "./contractFactory";

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
    return Promise.reject(new Error("Metamask not installed'"));
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
