import { store } from "@/store";
import { DeployedContract, getContract } from "./contractFactory";
import { globalActions } from "@/store/globalSlices";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

const { setLeaseTokens } = globalActions;

export const getLeaseToken = async (wallet: string) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed'"));
  }

  try {
    const leaseTokenContract = await getContract(
      DeployedContract.LeaseTokenContract
    );
    const tx = await leaseTokenContract.getLeaseToken();
    await tx.wait();
    await getBalance(wallet);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getBalance = async (wallet: string) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed'"));
  }

  try {
    const leaseTokenContract = await getContract(
      DeployedContract.LeaseTokenContract
    );
    const balance = await leaseTokenContract.checkLeaseToken(wallet);
    store.dispatch(setLeaseTokens(balance));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};
