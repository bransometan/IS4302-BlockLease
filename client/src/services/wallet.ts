import { store } from "@/store";
import { globalActions } from "@/store/globalSlices";

const { setWallet } = globalActions;
let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

/**
 * Set User Wallet on MetaMask
 */
export const connectWallet = async () => {
  try {
    if (!ethereum) return reportError("Please install Metamask");
    const accounts = await ethereum.request?.({
      method: "eth_requestAccounts",
    });
    store.dispatch(setWallet(accounts?.[0]));
  } catch (error) {
    reportError(error);
  }
};

/**
 * Checks for updates to wallet (account, chain etc)
 */
export const checkWallet = async () => {
  try {
    if (!ethereum) return reportError("Please install Metamask");
    const accounts = await ethereum.request?.({ method: "eth_accounts" });

    ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    ethereum.on("accountsChanged", async () => {
      store.dispatch(setWallet(accounts?.[0]));
      await checkWallet();
    });

    if (accounts?.length) {
      store.dispatch(setWallet(accounts[0]));
    } else {
      store.dispatch(setWallet(""));
      reportError("Please connect wallet, no accounts found.");
    }
  } catch (error) {
    reportError(error);
  }
};
