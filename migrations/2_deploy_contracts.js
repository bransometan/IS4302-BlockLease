// "LeaseToken" represents a smart contract for managing lease tokens.
const LeaseToken = artifacts.require("LeaseToken");
// "PaymentEscrow" represents a smart contract for managing payment escrow.
const PaymentEscrow = artifacts.require("PaymentEscrow");
// "RentalProperty" represents a smart contract for managing rental properties.
const RentalProperty = artifacts.require("RentalProperty");
// "RentalMarketplace" represents a smart contract for managing a marketplace for renting properties.
const RentalMarketplace = artifacts.require("RentalMarketplace");
// "RentDisputeDAO" represents a smart contract for managing disputes related to rent.
const RentDisputeDAO = artifacts.require("RentDisputeDAO");

// Fixed parameters for the contracts
const PROTECTION_FEE = 50; // The fee that the payment escrow imposes on the landlord during property listing for protection against disputes
const VOTER_REWARD = 50; // The reward that the payment escrow imposes on the tenant to stake for incentivizing voting on disputes
const VOTE_PRICE = 1; // The price that the payment escrow imposes on the validator to vote on disputes
const MINIMUM_VOTES = 4; // The minimum number of votes required to resolve a dispute specified by the RentDisputeDAO contract

// Deployment order: LeaseToken -> PaymentEscrow -> RentalProperty -> RentalMarketplace -> RentDisputeDAO
module.exports = async (deployer, network, accounts) => {
  
  // First: Deploy the LeaseToken contract
  await deployer.deploy(LeaseToken).then(function () {
    // Second: Deploy the PaymentEscrow contract and pass the address of the LeaseToken contract and the other fixed parameters
    return deployer.deploy(
      PaymentEscrow,
      LeaseToken.address,
      PROTECTION_FEE,
      VOTER_REWARD,
      VOTE_PRICE
    );
  });
  
  // Get the instance of the PaymentEscrow contract
  const escrowContract = await PaymentEscrow.deployed();

  // Third: Deploy the RentalProperty contract
  await deployer.deploy(RentalProperty).then(function () {
    // Fourth: Deploy the RentalMarketplace contract and pass the address of the RentalProperty and PaymentEscrow contracts
    return deployer.deploy(
      RentalMarketplace,
      RentalProperty.address,
      PaymentEscrow.address
    );
  });
  // Fifth: Deploy the RentDisputeDAO contract and pass the address of the RentalProperty, PaymentEscrow, and RentalMarketplace contracts
  await deployer.deploy(
    RentDisputeDAO,
    RentalProperty.address,
    PaymentEscrow.address,
    RentalMarketplace.address,
    MINIMUM_VOTES
  );

  // Use the instance earlier and set the addresses of the RentalMarketplace and RentDisputeDAO contracts in the PaymentEscrow contract
  await escrowContract.setRentalMarketplaceAddress(RentalMarketplace.address);
  await escrowContract.setRentDisputeDAOAddress(RentDisputeDAO.address);
};
