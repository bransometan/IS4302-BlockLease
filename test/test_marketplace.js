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

    const depositFee = 50; // deposit fee

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
        let amountOfEthToSend = web3.utils.toWei('10', 'ether');

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
        let hdb1 = await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "1", 0 , "Nice place", "2", "30", "12", {from: landlord});
        let hdb2 = await rentalPropertyInstance.addRentalProperty("123 Bishan Street 10", "s321323", "2", 0 , "Amazing vibe", "5", "50", "12", {from: landlord});

        // use as example at the bottom
        let condo1 = await rentalPropertyInstance.addRentalProperty("123 Jurong East ", "s423443", "3", 1 , "Nice place amazing", "3", "20", "12", {from: landlord});
        let condo2 = await rentalPropertyInstance.addRentalProperty("12 Mandai Avenue", "s534534", "2", 1 , "cool place", "1", "50", "12", {from: landlord});

        let landed1 = await rentalPropertyInstance.addRentalProperty("76 Sengkang Drive", "s534533", "5", 2 , "Bright place", "6", "20", "12", {from: landlord});
        let landed2 = await rentalPropertyInstance.addRentalProperty("11 Bukit Timah Hill", "s532666", "5", 2 , "Windy place", "5", "20", "12", {from: landlord});

        let other1 = await rentalPropertyInstance.addRentalProperty("123 Industrial St", "s5435443", "2", 3 , "Cool place", "10", "40", "12", {from: landlord});

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

                                                            
    it('Test Case 1: Landlord CANNOT list property', async () => {
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
    it('Test Case 2: Landlord CAN list a property on market place', async () => {
        let amountOfEthToSend = web3.utils.toWei('10', 'ether');
        let result = await leaseTokenInstance.getLeaseToken({
            from: landlord, 
            value: amountOfEthToSend
        });
        let landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Landlord Balance " + landlordBalance.toString())

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(1, depositFee, {from: landlord});
        truffleAssert.eventEmitted(rentalProperty, 'RentalPropertyListed');

        const isListed = await rentalPropertyInstance.getListedStatus(1);
        assert.equal(isListed, true, "Property should be listed");
    });

    it("Test Case 3: Landlord can update property when there is no tenant applications", async () => {
        // take from the listing above which is property id 1
        const ifAnyoneApplied = await rentalMarketplaceInstance.getRentalApplicationCount(1);
        assert.equal(ifAnyoneApplied, false, "Property has tenant applications")
        let updatedTitle = "239 Main St";
        let updatedDescription = "Even nicer place";
        let updatedRentalPrice = 35;
        let updateResult = await rentalPropertyInstance.updateRentalProperty(
            1, updatedTitle, "s123457", "Unit 2", 0, updatedDescription, 3, updatedRentalPrice, 12, {from: landlord}
        );

        truffleAssert.eventEmitted(updateResult, 'RentalPropertyUpdateDetails');

        let updatedProperty = await rentalPropertyInstance.getRentalProperty(1);
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
        assert.equal(isListed, false, "Property should be unlisted");
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

        let t1balance = await leaseTokenInstance.checkLeaseToken(tenant1);
        let t2balance = await leaseTokenInstance.checkLeaseToken(tenant2);
        let t3balance = await leaseTokenInstance.checkLeaseToken(tenant3);

        assert.equal(t1balance, 950, "Tenant wallet should have deducted the amount");
        assert.equal(t2balance, 950, "Tenant wallet should have deducted the amount");
        assert.equal(t3balance, 950, "Tenant wallet should have deducted the amount");

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
            let updatedRentalPrice = 10;
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

    it("Test Case 9: Landlord cancel tenant rental application", async () => {
        // cancel tenat 1 application
        let t1balancebefore = await leaseTokenInstance.checkLeaseToken(tenant1);
        console.log(`Balance Before: ${t1balancebefore.toString()}`);

        const result = await rentalMarketplaceInstance.cancelOrRejectRentalApplication(2, 0, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalApplicationCancelOrRejected');

        let t1balance = await leaseTokenInstance.checkLeaseToken(tenant1);

        let expectedBalanceAfter = new web3.utils.BN(t1balancebefore).add(new web3.utils.BN(depositFee));
        assert.equal(t1balance.toString(), expectedBalanceAfter.toString(), "Deposit Fee not refunded correctly");

        console.log(`Balance After: ${t1balance.toString()}`);

    });

    it("Test Case 10: Landlord accepts rental application", async () => {
        // accept tenant 2 application
        let landlordBBefore = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Landlord wallet balance BEFORE accept applicaton : " + landlordBBefore.toString())

        const result = await rentalMarketplaceInstance.acceptRentalApplication(2, 1, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalApplicationAccepted');
        
        // check landlord wallet 
        let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        let expectedBalanceAfter = new web3.utils.BN(landlordBBefore).add(new web3.utils.BN(depositFee));
        assert.equal(landlordB.toString(), expectedBalanceAfter.toString(), "Deposit fee not received from tenant");

        console.log("Landlord wallet balance AFTER accept applicaton : " + landlordB.toString())

    });

    it("Test Case 11: Tenant cancel tenant rental application", async () => {
        // cancel tenat 3 application
        let t3balanceBefore = await leaseTokenInstance.checkLeaseToken(tenant3);
        console.log(`Balance Before: ${t3balanceBefore.toString()}`);
    
        const result = await rentalMarketplaceInstance.cancelOrRejectRentalApplication(2, 2, {from: tenant3});
        truffleAssert.eventEmitted(result, 'RentalApplicationCancelOrRejected');
    
        // After cancellation
        let t3balanceAfter = await leaseTokenInstance.checkLeaseToken(tenant3);
        let expectedBalanceAfter = new web3.utils.BN(t3balanceBefore).add(new web3.utils.BN(depositFee));
        assert.equal(t3balanceAfter.toString(), expectedBalanceAfter.toString(), "Deposit Fee not refunded correctly");

        console.log(`Balance After: ${t3balanceAfter.toString()}`);
    });

    it("Test Case 12 FAILURE: : Landlord cannot accept payment from rental application when the rental application is not yet accepted", async () => {
        try {
            await rentalMarketplaceInstance.acceptPayment(2, 1, {from: landlord});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Tenant has not made payment'), "Unexpected error message: " + error.message);
        }

    });

    it("Test Case 13: Tenant make payment for monthly rental fee", async () => {
        let tenant2before = await leaseTokenInstance.checkLeaseToken(tenant2);
        console.log("Before Payment Made :" + tenant2before.toString())

        const result = await rentalMarketplaceInstance.makePayment(2, 1, {from: tenant2});
        truffleAssert.eventEmitted(result, 'PaymentMade');

        let tenant2after = await leaseTokenInstance.checkLeaseToken(tenant2);
        console.log("After Payment Made :" + tenant2after.toString())
    });

    it("Test Case 14: Landlord accept payment for monthly rental fee from a tenant", async () => {
        let landlordbefore = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Before Rental Receive:" + landlordbefore.toString())

        const result = await rentalMarketplaceInstance.acceptPayment(2, 1, {from: landlord});
        truffleAssert.eventEmitted(result, 'PaymentAccepted');

        let landlordafter = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("After Monthly Rental Receive:" + landlordafter.toString())
    });

    it("Test Case 15 FAILURE: : Tenant cannot move out from rental property when payment not made for entire lease period", async () => {
        try {
            await rentalMarketplaceInstance.moveOut(2, 1, {from: tenant2});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental application is not completed'), "Unexpected error message: " + error.message);
        }

    });

    it("Test Case 16: Tenant move out from rental property", async () => {
        // based on the example propertyid 2 has lease of 12
        for (let i = 0; i < 11; i++) {
            let t2before = await leaseTokenInstance.checkLeaseToken(tenant2);
            console.log(`Tenant Start Balance for Month ${i + 2} :` + t2before.toString())

            await rentalMarketplaceInstance.makePayment(2, 1, {from: tenant2});
            await rentalMarketplaceInstance.acceptPayment(2, 1, {from: landlord});

            let t2after = await leaseTokenInstance.checkLeaseToken(tenant2);
            console.log(`Tenant Balance After Rental Month ${i + 2}:` + t2after.toString())
        }

        await rentalMarketplaceInstance.moveOut(2, 1, {from: tenant2});

        let t2end = await leaseTokenInstance.checkLeaseToken(tenant2);
        console.log("After Move Out + Deposit Fee:" + t2end.toString())
        
    });

    // need to check on the protection fee how it works
    it("Test Case 17: Landlord unlist rental property", async () => {
        const landlordwallet = await leaseTokenInstance.checkLeaseToken(landlord);
        // console.log("Before List Property:" + landlordwallet.toString())

        // const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(3, depositFee, {from: landlord});
        // truffleAssert.eventEmitted(rentalProperty, 'RentalPropertyListed');

        console.log("Before Unlist Property:" + landlordwallet.toString())

        const result = await rentalMarketplaceInstance.unlistARentalProperty(2, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalPropertyUnlisted');

        const landlordwalletA = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("After Unlist (Refund + full protection fee) :" + landlordwalletA.toString())
    });


    

    
});



