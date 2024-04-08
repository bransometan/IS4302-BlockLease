import { Addressable, Interface, InterfaceAbi, ethers } from "ethers";
import { GANACHE_NETWORK_ID } from "@/constants";
import RentalPropertyContract from "../../../build/contracts/RentalProperty.json";
import RentalMarketplaceContract from "../../../build/contracts/RentalMarketplace.json";
import RentalDisputeDAOContract from "../../../build/contracts/RentalDisputeDAO.json";
import LeaseTokenContract from "../../../build/contracts/LeaseToken.json";
import PaymentEscrowContract from "../../../build/contracts/PaymentEscrow.json";

export enum DeployedContract {
  RentalPropertyContract,
  RentalMarketplaceContract,
  // RentalDisputeDAOContract,
  LeaseTokenContract,
  PaymentEscrowContract,
}

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

/**
 * Return instance of Contract for client to interact
 * @returns An instance of Contract
 */
export const getContract = async (contract: DeployedContract) => {
  const provider = new ethers.BrowserProvider(ethereum);

  let deployedNetwork;
  let contractAddress: string | Addressable = "";
  let contractAbi: Interface | InterfaceAbi = "";

  switch (contract) {
    case DeployedContract.RentalPropertyContract:
      deployedNetwork = RentalPropertyContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = RentalPropertyContract.abi;
      break;
    case DeployedContract.RentalMarketplaceContract:
      deployedNetwork = RentalMarketplaceContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = RentalMarketplaceContract.abi;
      break;
    // case Contract.RentalDisputeDAOContract:
    //   deployedNetwork = RentalDisputeDAOContract.networks[GANACHE_NETWORK_ID];
    //   contractAddress = deployedNetwork.address;
    //   contractAbi = RentalDisputeDAOContract.abi;
    //   break;
    case DeployedContract.LeaseTokenContract:
      deployedNetwork = LeaseTokenContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = LeaseTokenContract.abi;
      break;
    case DeployedContract.PaymentEscrowContract:
      deployedNetwork = PaymentEscrowContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = PaymentEscrowContract.abi;
      break;
    default:
      break;
  }

  const signer = await provider.getSigner();
  const contractInstance = new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  );
  return contractInstance;
};
