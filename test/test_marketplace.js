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

contract('Rental Property + Rental Marketplace Test Cases', function(accounts) {
    let leaseTokenInstance, paymentEscrowInstance, rentalMarketplaceInstance, rentalPropertyInstance, rentDisputeDAOInstance;

    // const owner = accounts[0];
    const landlord = accounts[1];
    const tenant1 = accounts[2];
    const tenant2 = accounts[3];
    const tenant3 = accounts[4];

    const depositFee = 100; // deposit fee
    const rentalPropertyId = 2; // will be only using rentalPropertyId for 1

    before(async () => {
        leaseTokenInstance = await LeaseToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        rentalMarketplaceInstance = await RentalMarketplace.deployed();
        rentalPropertyInstance = await RentalProperty.deployed();
        rentDisputeDAOInstance = await RentDisputeDAO.deployed();
    });

    it('Tenant gets LeaseTokens in exchange for ETH', async () => {
        // Amount of ETH the landlord will send to the contract to get LeaseTokens.
        // For example, 0.1 ETH will give them 10 LeaseTokens if the rate is 0.01 ETH per LeaseToken.
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');

        let result = await leaseTokenInstance.getLeaseToken({
            from: tenant1, 
            value: amountOfEthToSend
        });

        let result1 = await leaseTokenInstance.getLeaseToken({
            from: tenant2, 
            value: amountOfEthToSend
        });

        let result2 = await leaseTokenInstance.getLeaseToken({
            from: tenant3, 
            value: amountOfEthToSend
        });

    });


/* 
    $$$$$$$\                       $$\               $$\       $$$$$$$\                                                     $$\               
$$  __$$\                      $$ |              $$ |      $$  __$$\                                                    $$ |              
$$ |  $$ | $$$$$$\  $$$$$$$\ $$$$$$\    $$$$$$\  $$ |      $$ |  $$ | $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\ $$$$$$\   $$\   $$\ 
$$$$$$$  |$$  __$$\ $$  __$$\\_$$  _|   \____$$\ $$ |      $$$$$$$  |$$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\\_$$  _|  $$ |  $$ |
$$  __$$< $$$$$$$$ |$$ |  $$ | $$ |     $$$$$$$ |$$ |      $$  ____/ $$ |  \__|$$ /  $$ |$$ /  $$ |$$$$$$$$ |$$ |  \__| $$ |    $$ |  $$ |
$$ |  $$ |$$   ____|$$ |  $$ | $$ |$$\ $$  __$$ |$$ |      $$ |      $$ |      $$ |  $$ |$$ |  $$ |$$   ____|$$ |       $$ |$$\ $$ |  $$ |
$$ |  $$ |\$$$$$$$\ $$ |  $$ | \$$$$  |\$$$$$$$ |$$ |      $$ |      $$ |      \$$$$$$  |$$$$$$$  |\$$$$$$$\ $$ |       \$$$$  |\$$$$$$$ |
\__|  \__| \_______|\__|  \__|  \____/  \_______|\__|      \__|      \__|       \______/ $$  ____/  \_______|\__|        \____/  \____$$ |
                                                                                         $$ |                                   $$\   $$ |
                                                                                         $$ |                                   \$$$$$$  |
                                                                                         \__|                                    \______/
 */


    it('Test : Landlord add rental property', async () => {
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


    it('Test : Landlord deletes their property listing', async () => {
        // Landlord deletes the property -> we use 6
        let deleteResult = await rentalPropertyInstance.deleteRentalProperty(6, {from: landlord});
        truffleAssert.eventEmitted(deleteResult, 'RentalPropertyDeleted');
    
        // let property = await rentalPropertyInstance.getRentalProperty(6);
        // assert.equal(property.exists, false, "Property should be marked as non-existent.");
        
    });
    /* 
        888b     d888                  888               888             888                           
    8888b   d8888                  888               888             888                           
    88888b.d88888                  888               888             888                           
    888Y88888P888  8888b.  888d888 888  888  .d88b.  888888 88888b.  888  8888b.   .d8888b .d88b.  
    888 Y888P 888     "88b 888P"   888 .88P d8P  Y8b 888    888 "88b 888     "88b d88P"   d8P  Y8b 
    888  Y8P  888 .d888888 888     888888K  88888888 888    888  888 888 .d888888 888     88888888 
    888   "   888 888  888 888     888 "88b Y8b.     Y88b.  888 d88P 888 888  888 Y88b.   Y8b.     
    888       888 "Y888888 888     888  888  "Y8888   "Y888 88888P"  888 "Y888888  "Y8888P "Y8888  
                                                            888                                    
                                                            888                                    
                                                            888
    */

                                                            
    it('Test 1: Landlord CANNOT list property', async () => {
        let amountOfEthToSend = web3.utils.toWei('0.4', 'ether');

        await leaseTokenInstance.getLeaseToken({
            from: landlord,
            value: amountOfEthToSend
        });

        let landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Landlord's LeaseToken Balance:", landlordBalance.toString());
    
        try {
            await rentalMarketplaceInstance.listARentalProperty(1, depositFee, {from: landlord});
            assert.fail("The transaction should have reverted due to insufficient balance!");
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(
                error.message.includes('revert Payer does not have enough balance'),
                "Unexpected error message: " + error.message
            );
        }
    });
                                                                                                                   

    // will only be using property id 1 as example
    it('Test 2: Landlord CAN list a property on market place', async () => {
        let amountOfEthToSend = web3.utils.toWei('2', 'ether');
        let result = await leaseTokenInstance.getLeaseToken({
            from: landlord, 
            value: amountOfEthToSend
        });
        let landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log(landlordBalance.toString())

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(1, depositFee, {from: landlord});
        truffleAssert.eventEmitted(rentalProperty, 'RentalPropertyListed');

        const isListed = await rentalPropertyInstance.getListedStatus(1);
    });

    it("Test Case 3: Landlord can update property when there is no tenant applications", async () => {
        // take from the listing above which is property id 1
        const ifAnyoneApplied = await rentalMarketplaceInstance.getRentalApplicationCount(1);
        assert.equal(ifAnyoneApplied, false, "Property has tenant applications")
        let updatedTitle = "239 Main St";
        let updatedDescription = "Even nicer place";
        let updatedRentalPrice = 350;
        let updateResult = await rentalPropertyInstance.updateRentalProperty(
            1, updatedTitle, "s123457", "Unit 2", 0, updatedDescription, 3, updatedRentalPrice, 12, {from: landlord}
        );

        truffleAssert.eventEmitted(updateResult, 'RentalPropertyUpdateDetails');

        let updatedProperty = await rentalPropertyInstance.getRentalProperty(1);
        console.log(updatedProperty)
        assert.equal(updatedProperty[1], updatedTitle, "Property title should be updated.");
        assert.equal(updatedProperty[5], updatedDescription, "Property description should be updated.");
        assert.equal(updatedProperty[7], updatedRentalPrice, "Rental price should be updated.");
    });

    

    it("Test Case 4: Landlord can unlist property when there is no tenant applications", async () => {
        const ifAnyoneApplied = await rentalMarketplaceInstance.getRentalApplicationCount(1);
        assert.equal(ifAnyoneApplied, false, "Property has tenant applications")
        const unlistResult = await rentalMarketplaceInstance.unlistARentalProperty(1, {from: landlord});
        truffleAssert.eventEmitted(unlistResult, 'RentalPropertyUnlisted');
        const isListed = await rentalPropertyInstance.getListedStatus(1);
        console.log(isListed)
    });

    it("Test Case 5: Tenant can apply for rental property", async () => {
        await rentalMarketplaceInstance.listARentalProperty(2, depositFee, {from: landlord});
        // token already exchange at the start
        // 3 tenants apply for Property 2
        const result1 = await rentalMarketplaceInstance.applyRentalProperty(2, "John Doe", "johndoe@example.com", "1235567890", "Need a place near school", {from: tenant1});
        const result2 = await rentalMarketplaceInstance.applyRentalProperty(2, "John Neymar", "johnneymar@example.com", "1243437890", "Need a place near work", {from: tenant2});
        const result3 = await rentalMarketplaceInstance.applyRentalProperty(2, "John Messi", "johnmessi@example.com", "123412890", "Need a place near park", {from: tenant3});

        truffleAssert.eventEmitted(result1, 'RentalApplicationSubmitted');
        truffleAssert.eventEmitted(result2, 'RentalApplicationSubmitted');
        truffleAssert.eventEmitted(result3, 'RentalApplicationSubmitted');

        // check tenant balances (should have 400 left (500-100))
        let t1balance = await leaseTokenInstance.checkLeaseToken(tenant1);
        let t2balance = await leaseTokenInstance.checkLeaseToken(tenant2);
        let t3balance = await leaseTokenInstance.checkLeaseToken(tenant3);

        assert.equal(t1balance, 400, "Tenant wallet should have deducted the amount");
        assert.equal(t2balance, 400, "Tenant wallet should have deducted the amount");
        assert.equal(t3balance, 400, "Tenant wallet should have deducted the amount");

    });

    it("Test Case 6 FAILURE: Landlord cannot unlist property when there are applications", async () => {
        try {
            // Attempt to unlist the property which should fail due to existing applications
            await rentalMarketplaceInstance.unlistARentalProperty(2, {from: landlord});
            assert.fail("The transaction should have reverted!");
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental property is not vacant'), "Unexpected error message: " + error.message);
        }
    });

    it("Test Case 7 FAILURE: Landlord cannot update property when there are applications", async () => {
        try {
            let updatedTitle = "123 Failure St";
            let updatedDescription = "Nicest place";
            let updatedRentalPrice = 100;
            await rentalPropertyInstance.updateRentalProperty(
                2, updatedTitle, "s123457", "Unit 2", 0, updatedDescription, 3, updatedRentalPrice, 12, {from: landlord}
            );
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental Property cannot be updated or deleted'), "Unexpected error message: " + error.message);
        }
    });

    it("Test Case 8 FAILURE: Landlord cannot delete property when there are applications", async () => {
        try {
            await rentalPropertyInstance.deleteRentalProperty(2, {from: landlord});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental Property cannot be updated or deleted'), "Unexpected error message: " + error.message);
        }
    });

    it("Test : Tenant makes a payment for the rental property", async () => {
        // Provided that the previous step where the Landlord has accept the rental application
        const result = await rentalMarketplaceInstance.makePayment(rentalPropertyId, 0, {from: tenant1});
        truffleAssert.eventEmitted(result, 'PaymentMade');
    });

    it("Test : Landlord accepts payment from tenant", async () => {
        const result = await rentalMarketplaceInstance.acceptPayment(rentalPropertyId, 0, {from: landlord});
        truffleAssert.eventEmitted(result, 'PaymentAccepted');
    });

    // Cancel edge cases

    it("Landlord or tenant cancels or rejects a rental application", async () => {
        // reapply the Property uni
        await rentalMarketplaceInstance.applyRentalProperty(rentalPropertyId, "Jane Doe", "janedoe@example.com", "987654321", "Looking for a quieter place", {from: tenant1});
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
        await rentalMarketplaceInstance.updateDepositFeeBalance(rentalPropertyId, 200, {from: landlord}); // Assuming DAO or system function
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

    //  test the edge cases
    
});



