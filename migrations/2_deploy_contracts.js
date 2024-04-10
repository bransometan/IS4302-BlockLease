const LeaseToken = artifacts.require("LeaseToken");
const PaymentEscrow = artifacts.require("PaymentEscrow");
const RentalProperty = artifacts.require("RentalProperty");
const RentalMarketplace = artifacts.require("RentalMarketplace");

const PROTECTION_FEE = 50;
const VOTER_REWARD = 50;

module.exports = (deployer, network, accounts) => {
  deployer.deploy(LeaseToken).then(function () {
    return deployer.deploy(
      PaymentEscrow,
      LeaseToken.address,
      PROTECTION_FEE,
      VOTER_REWARD
    );
  });
  deployer.deploy(RentalProperty).then(function () {
    return deployer.deploy(
      RentalMarketplace,
      RentalProperty.address,
      PaymentEscrow.address
    );
  });
};
