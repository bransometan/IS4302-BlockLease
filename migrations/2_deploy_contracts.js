const LeaseToken = artifacts.require("LeaseToken");
const PaymentEscrow = artifacts.require("PaymentEscrow");
const RentalProperty = artifacts.require("RentalProperty");
const RentalMarketplace = artifacts.require("RentalMarketplace");

const PROTECTION_FEE = 1;
const COMMISSION_FEE = 1;
const VOTER_REWARD = 1;

module.exports = (deployer, network, accounts) => {
  deployer.deploy(LeaseToken).then(function () {
    return deployer.deploy(
      PaymentEscrow,
      LeaseToken.address,
      PROTECTION_FEE,
      COMMISSION_FEE,
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
