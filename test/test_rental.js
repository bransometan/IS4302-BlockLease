// Require contracts to be deployed and assertion frameworks initialisation
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

contract('Rental Platform Tests', function(accounts) {
    let leaseTokenInstance, paymentEscrowInstance, rentalMarketplaceInstance, rentalPropertyInstance, rentDisputeDAOInstance;

    const owner = accounts[0];
    const landlord = accounts[1];
    const tenant = accounts[2];
    const depositFee = Web3.utils.toWei('1', 'ether'); // deposit fee
    const rentalPropertyId = 1; // will be only using rentalPropertyId for 1

    before(async () => {
        leaseTokenInstance = await LeaseToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        rentalMarketplaceInstance = await RentalMarketplace.deployed();
        rentalPropertyInstance = await RentalProperty.deployed();
        rentDisputeDAOInstance = await RentDisputeDAO.deployed();

        // leaseTokenInstance.getCredit(web3.utils.toWei("10", "ether"));
    });

    // 
    it('Test : Landlord set up property listing', async () => {
        // Landlord lists a property
        let hdb1 = await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "1", 0 , "Nice place", "2", "300", "12", {from: landlord});
        let hdb2 = await rentalPropertyInstance.addRentalProperty("123 Bishan Street 10", "s321323", "2", 0 , "Amazing vibe", "5", "500", "12", {from: landlord});

        let condo1 = await rentalPropertyInstance.addRentalProperty("123 Jurong East ", "s423443", "3", 1 , "Nice place amazing", "3", "300", "12", {from: landlord});
        let condo2 = await rentalPropertyInstance.addRentalProperty("12 Mandai Avenue", "s534534", "2", 1 , "cool place", "1", "300", "12", {from: landlord});

        let landed1 = await rentalPropertyInstance.addRentalProperty("76 Sengkang Drive", "s534533", "5", 2 , "Bright place", "6", "2332", "12", {from: landlord});
        let landed2 = await rentalPropertyInstance.addRentalProperty("11 Bukit Timah Hill", "s532666", "5", 2 , "Windy place", "5", "4000", "12", {from: landlord});

        let other1 = await rentalPropertyInstance.addRentalProperty("123 Industrial St", "s5435443", "2", 3 , "Cool place", "10", "1000", "12", {from: landlord});

        truffleAssert.eventEmitted(hdb1, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(hdb2, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(condo1, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(condo2, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(landed1, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(landed2, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(other1, 'RentalPropertyCreated');
    });

    // landlord update property details 
    it('Test : Landlord update their property details', async () => {

        let updatedTitle = "124 Main St";
        let updatedDescription = "Even nicer place";
        let updatedRentalPrice = "350";
        let updateResult = await rentalPropertyInstance.updateRentalProperty(
            0, updatedTitle, "s123457", "Unit 2", 0, updatedDescription, "3", updatedRentalPrice, "12", {from: landlord}
        );

        truffleAssert.eventEmitted(updateResult, 'RentalPropertyUpdateDetails');

        let updatedProperty = await rentalPropertyInstance.getRentalProperty(0);
        assert.equal(updatedProperty[1], updatedTitle, "Property title should be updated.");
        assert.equal(updatedProperty[5], updatedDescription, "Property description should be updated.");
        assert.equal(updatedProperty[7], updatedRentalPrice, "Rental price should be updated.");
    });

    it('Test : Landlord deletes their property listing', async () => {
        // Landlord deletes the property -> we use 6
        let deleteResult = await rentalPropertyInstance.deleteRentalProperty(6, {from: landlord});
        truffleAssert.eventEmitted(deleteResult, 'RentalPropertyDeleted');
    
        // let property = await rentalPropertyInstance.getRentalProperty(6);
        // assert.equal(property.exists, false, "Property should be marked as non-existent.");
        
    });

    // will only be using property id 1 as example

    it('Test : Landlord to list a property', async () => {
        let landlordBalance = await leaseTokenInstance.getLeaseToken();
        console.log("Landlord LeaseToken Balance:", landlordBalance.toString());
        // assert.strictEqual(landlordBalance.toString(), "10", "Deposited Lease Tokens not transferred to contract");

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(1, depositFee, {from: landlord});
        truffleAssert.eventEmitted(rentalProperty, 'RentalPropertyListed');

        const isListed = await rentalPropertyInstance.getListedStatus(1);
        assert.isTrue(isListed, "The property should be listed.");
    });

    it("Test : Landlord unlists a property from the marketplace", async () => {
        // take from the listing above which is property id 1
        const unlistResult = await rentalMarketplaceInstance.unlistARentalProperty(1, {from: landlord});
        truffleAssert.eventEmitted(unlistResult, 'RentalPropertyUnlisted');
        const isListed = await rentalPropertyInstance.getListedStatus(1);
        assert.isFalse(isListed, "Property should be unlisted.");
    });

    it("Test : Tenant applies for a rental property", async () => {
        // use another property = ID 2
        // await rentalMarketplaceInstance.listARentalProperty(2, depositFee, {from: landlord});
        const result = await rentalMarketplaceInstance.applyRentalProperty(rentalPropertyId, "John Doe", "johndoe@example.com", "1234567890", "Need a place near work", {from: tenant});
        truffleAssert.eventEmitted(result, 'RentalApplicationSubmitted');

        const appCount = await rentalMarketplaceInstance.getRentalApplicationCount(2);
        assert.equal(appCount, 1, "There should be one application.");
    });

    it("Test : Landlord accepts a rental application", async () => {

        // use back the the same rental application
        const result = await rentalMarketplaceInstance.acceptRentalApplication(rentalPropertyId, 0, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalApplicationAccepted');
        const appDetails = await rentalMarketplaceInstance.getRentalApplication(rentalPropertyId, 0);
        assert.equal(appDetails.status, "ONGOING", "Application status should be 'ONGOING'.");
    });

    it("Test : Tenant makes a payment for the rental property", async () => {
        // Provided that the previous step where the Landlord has accept the rental application
        const result = await rentalMarketplaceInstance.makePayment(rentalPropertyId, 0, {from: tenant});
        truffleAssert.eventEmitted(result, 'PaymentMade');
    });

    it("Test : Landlord accepts payment from tenant", async () => {
        // Ensure payment was made
        await rentalMarketplaceInstance.makePayment(rentalPropertyId, 0, {from: tenant});
        const result = await rentalMarketplaceInstance.acceptPayment(rentalPropertyId, 0, {from: landlord});
        truffleAssert.eventEmitted(result, 'PaymentAccepted');
    });

    it("Test : Tenant moves out of the rental property", async () => {
        // Ensure rental application is completed
        await rentalMarketplaceInstance.acceptPayment(rentalPropertyId, 0, {from: landlord}); // Assuming this completes the rental
        const result = await rentalMarketplaceInstance.moveOut(rentalPropertyId, 0, {from: tenant});
        truffleAssert.eventEmitted(result, 'tenantMoveOut');
        const appDetails = await rentalMarketplaceInstance.getRentalApplication(rentalPropertyId, 0);
        assert.equal(appDetails.status, "COMPLETED", "Application status should be 'COMPLETED'.");
    });

    it("Landlord or tenant cancels or rejects a rental application", async () => {
        // Assuming there's an application pending
        await rentalMarketplaceInstance.applyRentalProperty(rentalPropertyId, "Jane Doe", "janedoe@example.com", "987654321", "Looking for a quieter place", {from: tenant});
        const applicationId = 0; // Assuming it's the first application for simplicity
        const result = await rentalMarketplaceInstance.cancelOrRejectRentalApplication(rentalPropertyId, applicationId, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalApplicationCancelOrRejected');
        // Check that the application no longer exists
        truffleAssert.reverts(rentalMarketplaceInstance.getRentalApplication(rentalPropertyId, applicationId), "Rental application does not exist");
    });

    it("Update deposit fee balance for a rental property", async () => {
        // List the property first
        await rentalMarketplaceInstance.listARentalProperty(rentalPropertyId, depositFee, {from: landlord});
        const newDepositFee = web3.utils.toWei("2", "ether");
        await rentalMarketplaceInstance.updateDepositFeeBalance(rentalPropertyId, newDepositFee, {from: landlord}); // Assuming DAO or system function
        const updatedDepositAmount = await rentalMarketplaceInstance.getDepositAmount(rentalPropertyId);
        assert.equal(updatedDepositAmount, newDepositFee, "Deposit fee should be updated to the new amount.");
    });

    it("Update rental application status", async () => {
        // Ensure there's an ongoing application
        await rentalMarketplaceInstance.acceptRentalApplication(rentalPropertyId, 0, {from: landlord});
        const newStatus = "COMPLETED"; // Use the corresponding numeric value from the RentStatus enum
        await rentalMarketplaceInstance.updateRentalApplicationStatus(rentalPropertyId, 0, newStatus, {from: landlord}); // Assuming DAO or system function
        const appDetails = await rentalMarketplaceInstance.getRentalApplication(rentalPropertyId, 0);
        assert.equal(appDetails.status, newStatus, "Application status should be updated to 'COMPLETED'.");
    });
    
});



