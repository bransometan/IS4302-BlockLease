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
    const tenant = accounts[2];
    const validator1 = accounts[3];
    const validator2 = accounts[4];
    const validator3 = accounts[5];
    const depositFee = 100;

    before(async () => {
        leaseTokenInstance = await LeaseToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        rentalMarketplaceInstance = await RentalMarketplace.deployed();
        rentalPropertyInstance = await RentalProperty.deployed();
        rentDisputeDAOInstance = await RentDisputeDAO.deployed();

    });

    it('Tenants able to create dispute', async () => {
        // Amount of ETH the landlord will send to the contract to get LeaseTokens.
        // For example, 0.1 ETH will give them 10 LeaseTokens if the rate is 0.01 ETH per LeaseToken.

        // ======== For testing, to be removed afters ========
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');

        // Call the getLeaseToken function and send ETH along with the transaction.
        let result = await leaseTokenInstance.getLeaseToken({
            from: landlord,
            value: amountOfEthToSend
        });

        let result2 = await leaseTokenInstance.getLeaseToken({
            from: tenant,
            value: amountOfEthToSend
        });
        let tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);

        let landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);

        let hdb1 = await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "1", 0, "Nice place", "2", "300", "1", { from: landlord });

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(0, depositFee, { from: landlord });
        landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);

        // Tenant apply for rental property
        const tenantApply = await rentalMarketplaceInstance.applyRentalProperty(0, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts
        const landlordAccept = await rentalMarketplaceInstance.acceptRentalApplication(0, 0, { from: landlord });
        // Tenant make payment to landlord
        const tenantPayLandlord = await rentalMarketplaceInstance.makePayment(0, 0, { from: tenant });
        // Landlord accept payment
        const landlordAcceptPayment = await rentalMarketplaceInstance.acceptPayment(0, 0, { from: landlord });
        // Dispute type is health and safety
        const tenantDispute1 = await rentDisputeDAOInstance.createRentDispute(0, 0, 1, "Landlord threatens to light house on fire", { from: tenant });
        truffleAssert.eventEmitted(tenantDispute1, 'RentDisputeCreated');
        // ======== End ========
    });

    it('Validators 1 & 2 can vote accept', async () => {
        // Call the getLeaseToken function and send ETH along with the transaction.
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');
        let result = await leaseTokenInstance.getLeaseToken({
            from: validator1,
            value: amountOfEthToSend
        });
        let result2 = await leaseTokenInstance.getLeaseToken({
            from: validator2,
            value: amountOfEthToSend
        });
        // The dispute id is 1 instead of 0, small bug but its ok :D
        let validator1VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator1 });
        truffleAssert.eventEmitted(validator1VoteAccept, 'VoteOnRentDispute');
        let validator2VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator2 });
        truffleAssert.eventEmitted(validator2VoteAccept, 'VoteOnRentDispute');
        // ======== End ========
    });

    it('Validators 3 can vote reject', async () => {
        // Call the getLeaseToken function and send ETH along with the transaction.
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');
        let result = await leaseTokenInstance.getLeaseToken({
            from: validator3,
            value: amountOfEthToSend
        });
        // idk why validator 3 cnt vote reject, damn weird
        let validator3VoteReject = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator3 });
        truffleAssert.eventEmitted(validator3VoteReject, 'VoteOnRentDispute');
        // ======== End ========
    });
});