const LeaseToken = artifacts.require("LeaseToken");
const PaymentEscrow = artifacts.require("PaymentEscrow");
const RentalProperty = artifacts.require("RentalProperty");
const RentalMarketplace = artifacts.require("RentalMarketplace");
const RentDisputeDAO = artifacts.require("RentDisputeDAO");

const PROTECTION_FEE = 50;
const VOTER_REWARD = 50;
const VOTE_PRICE = 1;
const MINIMUM_VOTES = 3;

module.exports = async (deployer, network, accounts) => {
  deployer.deploy(LeaseToken).then(function () {
    return deployer.deploy(
      PaymentEscrow,
      LeaseToken.address,
      PROTECTION_FEE,
      VOTER_REWARD,
      VOTE_PRICE
    );
  });
  const escrowContract = await PaymentEscrow.deployed();

  deployer.deploy(RentalProperty).then(function () {
    return deployer.deploy(
      RentalMarketplace,
      RentalProperty.address,
      PaymentEscrow.address
    );
  });

  deployer.deploy(
    RentDisputeDAO,
    RentalProperty.address,
    PaymentEscrow.address,
    RentalMarketplace.address,
    MINIMUM_VOTES
  );

  await escrowContract.setRentalMarketplaceAddress(RentalMarketplace.address);
  await escrowContract.setRentDisputeDAOAddress(RentDisputeDAO.address);
};
