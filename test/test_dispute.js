// dispute approve , rejected and draw
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');
const Web3 = require('web3'); // npm install web3

// Create variables to represent contracts
var LeaseToken = artifacts.require("../contracts/LeaseToken.sol");
var PaymentEscrow = artifacts.require("../contracts/PaymentEscrow.sol");
var RentalMarketplace = artifacts.require("../contracts/RentalMarketplace.sol");
var RentalProperty = artifacts.require("../contracts/RentalProperty.sol");
var RentDisputeDAO = artifacts.require("../contracts/RentDisputeDAO.sol");

contract('Rental Property + Rental Marketplace Test Cases', function (accounts) {
    let leaseTokenInstance, paymentEscrowInstance, rentalMarketplaceInstance, rentalPropertyInstance, rentDisputeDAOInstance;

    // const owner = accounts[0];
    const landlord = accounts[1];
    const tenant = accounts[4];
    const validator = accounts[3];
    const depositFee = Web3.utils.toWei('1', 'ether'); // deposit fee
    const rentalPropertyId = 2; // will be only using rentalPropertyId for 1

    before(async () => {
        leaseTokenInstance = await LeaseToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        rentalMarketplaceInstance = await RentalMarketplace.deployed();
        rentalPropertyInstance = await RentalProperty.deployed();
        rentDisputeDAOInstance = await RentDisputeDAO.deployed();

    });

    it('Before', async () => {
        // Amount of ETH the landlord will send to the contract to get LeaseTokens.
        // For example, 0.1 ETH will give them 10 LeaseTokens if the rate is 0.01 ETH per LeaseToken.

        // ======== For testing, to be removed afters ========
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');
        let amountOf100EthToSend = web3.utils.toWei('10', 'ether');

        // Call the getLeaseToken function and send ETH along with the transaction.
        let result = await leaseTokenInstance.getLeaseToken({
            from: landlord,
            value: amountOfEthToSend
        });

        let result2 = await leaseTokenInstance.getLeaseToken({
            from: tenant,
            value: amountOf100EthToSend
        });
        let tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log(tenantTokens.toString() + " this is tenant's leaseToken");

        let landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log(tenantTokens.toString() + " this is landlord's leaseToken before");
        let hdb1 = await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "1", 0, "Nice place", "2", "300", "12", { from: landlord });

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(0, 100, { from: landlord });
        landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log(tenantTokens.toString() + " this is landlord's leaseToken after");

        // Tenant apply for rental property
        const tenantApply = await rentalMarketplaceInstance.applyRentalProperty(0, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts
        // const landlordAccept = await rentalMarketplaceInstance.acceptRentalApplication(0, 0, {from: landlord});
        // ======== End ========
    });
});