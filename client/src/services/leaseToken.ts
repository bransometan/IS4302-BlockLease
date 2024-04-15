import { store } from "@/store";
import { DeployedContract, getContract } from "./contractFactory";
import { globalActions } from "@/store/globalSlices";
import { ethers } from "ethers";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

const { setLeaseTokens } = globalActions;

export const getLeaseToken = async (valueInEth: number) => {
  try {
    if (!ethereum) {
      reportError("Please install Metamask");
      return Promise.reject(new Error("Metamask not installed'"));
    }

    const leaseTokenContract = await getContract(
      DeployedContract.LeaseTokenContract
    );
    const options = { value: ethers.parseEther(valueInEth.toString()) };
    const tx = await leaseTokenContract.getLeaseToken(options);
    await tx.wait();
    await getBalance();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getBalance = async () => {
  try {
    if (!ethereum) {
      store.dispatch(setLeaseTokens(0));
      reportError("Please install Metamask");
      return Promise.reject(new Error("Metamask not installed'"));
    }
    const accounts = await ethereum.request?.({
      method: "eth_requestAccounts",
    });

    const leaseTokenContract = await getContract(
      DeployedContract.LeaseTokenContract
    );
    const balance = await leaseTokenContract.checkLeaseToken(accounts?.[0]);
    store.dispatch(setLeaseTokens(Number(balance)));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const convertLeaseTokenToETH = async (leaseTokenAmount: number) => {
  try {
    if (!ethereum) {
      reportError("Please install Metamask");
      return Promise.reject(new Error("Metamask not installed'"));
    }
    const accounts = await ethereum.request?.({
      method: "eth_requestAccounts",
    });

    const leaseTokenContract = await getContract(
      DeployedContract.LeaseTokenContract
    );
    const tx = await leaseTokenContract.convertLeaseTokenToETH(
      accounts?.[0],
      leaseTokenAmount
    );
    await tx.wait();
    await getBalance();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};
