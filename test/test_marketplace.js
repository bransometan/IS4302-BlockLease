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


    it('Test 1 (Success): Landlord add rental property', async () => {
        // Landlord lists 2 property of hdb type
        let hdb1 = await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "01-01", 0 , "Nice place", 2, 30, 12, {from: landlord});
        let hdb2 = await rentalPropertyInstance.addRentalProperty("123 Bishan Street 10", "s321323", "02-02", 0 , "Amazing vibe", 5, 50, 12, {from: landlord});

        // Landlord lists 2 property of condo type
        let condo1 = await rentalPropertyInstance.addRentalProperty("123 Jurong East ", "s423443", "03-03", 1 , "Nice place amazing", 3, 20, 12, {from: landlord});
        let condo2 = await rentalPropertyInstance.addRentalProperty("12 Mandai Avenue", "s534534", "04-04", 1 , "cool place", 1, 50, 12, {from: landlord});

        // Landlord lists 2 property of landed type
        let landed1 = await rentalPropertyInstance.addRentalProperty("76 Sengkang Drive", "s534533", "05-05", 2 , "Bright place", 6, 20, 12, {from: landlord});
        let landed2 = await rentalPropertyInstance.addRentalProperty("11 Bukit Timah Hill", "s532666", "06-06", 2 , "Windy place", 5, 20, 12, {from: landlord});

        // Landlord lists 1 property of other type
        let other1 = await rentalPropertyInstance.addRentalProperty("123 Industrial St", "s5435443", "07-07", 3 , "Cool place", 10, 40, 12, {from: landlord});

        // Check if the events are emitted
        truffleAssert.eventEmitted(hdb1, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(hdb2, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(condo1, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(condo2, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(landed1, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(landed2, 'RentalPropertyCreated');
        truffleAssert.eventEmitted(other1, 'RentalPropertyCreated');

        // Test using postal code
        assert.equal(await rentalPropertyInstance.getPostalCode(0), "s123456", "Property 0 not added");
        assert.equal(await rentalPropertyInstance.getPostalCode(1), "s321323", "Property 1 not added");
        assert.equal(await rentalPropertyInstance.getPostalCode(2), "s423443", "Property 2 not added");
        assert.equal(await rentalPropertyInstance.getPostalCode(3), "s534534", "Property 3 not added");
        assert.equal(await rentalPropertyInstance.getPostalCode(4), "s534533", "Property 4 not added");
        assert.equal(await rentalPropertyInstance.getPostalCode(5), "s532666", "Property 5 not added");
        assert.equal(await rentalPropertyInstance.getPostalCode(6), "s5435443", "Property 6 not added");

    });

    it('Test 2 (Success): Landlord updates rental property', async () => {
        // Landlord updates a rental property. As an example, we will use property 6
        let updateResult = await rentalPropertyInstance.updateRentalProperty(
            6, "239 Main St", "s123457", "11-11", 0, "Even nicer place", 3, 35, 12, {from: landlord}
        );

        // Check if the event is emitted
        truffleAssert.eventEmitted(updateResult, 'RentalPropertyUpdateDetails');
        
        // Check if the property is updated correctly using the postal code
        assert.equal(await rentalPropertyInstance.getPostalCode(6), "s123457", "Property 6 not updated");
    });


    it('Test 3 (Success): Landlord deletes their property listing', async () => {
        // Landlord deletes the property. As an example, we will use property 6
        let deleteResult = await rentalPropertyInstance.deleteRentalProperty(6, {from: landlord});
        truffleAssert.eventEmitted(deleteResult, 'RentalPropertyDeleted');
        
        // Check if the property is deleted correctly using the postal code
        assert.equal(await rentalPropertyInstance.getPostalCode(6), "", "Property 6 not deleted");        
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

    it('Test 1 (Success): Tenant gets LeaseTokens in exchange for ETH', async () => {
        // Amount of ETH a user will send to the contract to get LeaseTokens.
        // For example, 0.1 ETH will give them 10 LeaseTokens if the rate is 0.01 ETH per LeaseToken.
        // For this test, we will use 10 ETH to get 1000 LeaseTokens.

        // Get current balance of tenants
        let tenant1BalanceBefore = await leaseTokenInstance.checkLeaseToken(tenant1);
        let tenant2BalanceBefore = await leaseTokenInstance.checkLeaseToken(tenant2);
        let tenant3BalanceBefore = await leaseTokenInstance.checkLeaseToken(tenant3);

        // Convert 10 ETH to Wei
        let amountOfEthToSend = web3.utils.toWei('10', 'ether');

        // Get LeaseTokens in exchange for ETH for tenant1
        let result0 = await leaseTokenInstance.getLeaseToken({
            from: tenant1, 
            value: amountOfEthToSend
        });

        // Get LeaseTokens in exchange for ETH for tenant2
        let result1 = await leaseTokenInstance.getLeaseToken({
            from: tenant2, 
            value: amountOfEthToSend
        });

        // Get LeaseTokens in exchange for ETH for tenant3
        let result2 = await leaseTokenInstance.getLeaseToken({
            from: tenant3, 
            value: amountOfEthToSend
        });

        // Check if the events are emitted
        truffleAssert.eventEmitted(result0, 'getCredit');
        truffleAssert.eventEmitted(result1, 'getCredit');
        truffleAssert.eventEmitted(result2, 'getCredit');

        // Get current balance of tenants after getting LeaseTokens
        let tenant1BalanceAfter = await leaseTokenInstance.checkLeaseToken(tenant1);
        let tenant2BalanceAfter = await leaseTokenInstance.checkLeaseToken(tenant2);
        let tenant3BalanceAfter = await leaseTokenInstance.checkLeaseToken(tenant3);

        // Check if the LeaseTokens are received correctly
        assert.equal(tenant1BalanceAfter.toString(), (BigInt(tenant1BalanceBefore) + BigInt(1000)).toString(), "Tenant1 LeaseToken balance is incorrect");
        assert.equal(tenant2BalanceAfter.toString(), (BigInt(tenant2BalanceBefore) + BigInt(1000)).toString(), "Tenant2 LeaseToken balance is incorrect");
        assert.equal(tenant3BalanceAfter.toString(), (BigInt(tenant3BalanceBefore) + BigInt(1000)).toString(), "Tenant3 LeaseToken balance is incorrect");
        
    });

    it('Test 2 (Failure): Landlord CANNOT list property', async () => {
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
    it('Test 3 (Success): Landlord CAN list a property on market place', async () => {
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

    it("Test 4 (Success): Landlord can update property when there is no tenant applications", async () => {
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

    

    it("Test 5 (Success): Landlord can unlist property when there is no tenant applications", async () => {
        const ifAnyoneApplied = await rentalMarketplaceInstance.getRentalApplicationCount(1);
        assert.equal(ifAnyoneApplied, false, "Property has tenant applications")
        const unlistResult = await rentalMarketplaceInstance.unlistARentalProperty(1, {from: landlord});
        truffleAssert.eventEmitted(unlistResult, 'RentalPropertyUnlisted');
        const isListed = await rentalPropertyInstance.getListedStatus(1);
        assert.equal(isListed, false, "Property should be unlisted");
    });

    it("Test 6 (Success): Tenant can apply for rental property", async () => {
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

    it("Test 7 (Failure): Landlord cannot unlist property when there are applications", async () => {
        try {
            // Attempt to unlist the property which should fail due to existing applications
            await rentalMarketplaceInstance.unlistARentalProperty(2, {from: landlord});
            assert.fail("The transaction should have reverted!");
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental property is not vacant'), "Unexpected error message: " + error.message);
        }
    });

    it("Test 8 (Failure): Landlord cannot update property when there are applications", async () => {
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

    it("Test 9 (Failure): Landlord cannot delete property when there are applications", async () => {
        try {
            await rentalPropertyInstance.deleteRentalProperty(2, {from: landlord});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental Property cannot be updated or deleted'), "Unexpected error message: " + error.message);
        }
    });

    it("Test 10 (Success): Landlord cancel tenant rental application", async () => {
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

    it("Test 11 (Success): Landlord accepts rental application", async () => {
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

    it("Test 12 (Success): Tenant cancel tenant rental application", async () => {
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

    it("Test 13 (Failure): Landlord cannot accept payment from rental application when the rental application is not yet accepted", async () => {
        try {
            await rentalMarketplaceInstance.acceptPayment(2, 1, {from: landlord});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Tenant has not made payment'), "Unexpected error message: " + error.message);
        }

    });

    it("Test 14 (Success): Tenant make payment for monthly rental fee", async () => {
        //check whether application status change
        let application = await rentalMarketplaceInstance.getRentalApplication(2,1);
        assert.equal(application.status, 1, "Application status not ongoing");

        let tenant2before = await leaseTokenInstance.checkLeaseToken(tenant2);
        console.log("Before Payment Made :" + tenant2before.toString())

        const result = await rentalMarketplaceInstance.makePayment(2, 1, {from: tenant2});
        truffleAssert.eventEmitted(result, 'PaymentMade');

        let tenant2after = await leaseTokenInstance.checkLeaseToken(tenant2);
        let mfee = await rentalPropertyInstance.getRentalPrice(2);
        let expectedBalanceAfter = new web3.utils.BN(tenant2before).sub(new web3.utils.BN(mfee));
        assert.equal(tenant2after.toString(), expectedBalanceAfter.toString(), "Tenant have not made payment");
        console.log("After Payment Made :" + tenant2after.toString())
    });

    it("Test 15 (Success): Landlord accept payment for monthly rental fee from a tenant", async () => {
        let application = await rentalMarketplaceInstance.getRentalApplication(2,1);
        assert.equal(application.status, 2, "Application status not MAKE PAYMENT");

        let landlordbefore = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Before Rental Receive:" + landlordbefore.toString())

        const result = await rentalMarketplaceInstance.acceptPayment(2, 1, {from: landlord});
        truffleAssert.eventEmitted(result, 'PaymentAccepted');

        let landlordafter = await leaseTokenInstance.checkLeaseToken(landlord);
        let mfee = await rentalPropertyInstance.getRentalPrice(2);
        let expectedBalanceAfter = new web3.utils.BN(landlordbefore).add(new web3.utils.BN(mfee));
        assert.equal(landlordafter.toString(), expectedBalanceAfter.toString(), "Landlord have not accept payment");
        console.log("After Monthly Rental Receive:" + landlordafter.toString())
    });

    it("Test 16 (Failure): Tenant cannot move out from rental property when payment not made for entire lease period", async () => {
        try {
            await rentalMarketplaceInstance.moveOut(2, 1, {from: tenant2});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental application is not completed'), "Unexpected error message: " + error.message);
        }

    });

    it("Test 17 (Success): Tenant move out from rental property", async () => {
        // based on the example propertyid 2 has lease of 12
        for (let i = 0; i < 11; i++) {
            let t2before = await leaseTokenInstance.checkLeaseToken(tenant2);
            console.log(`Tenant Start Balance for Month ${i + 2} :` + t2before.toString())

            await rentalMarketplaceInstance.makePayment(2, 1, {from: tenant2});
            await rentalMarketplaceInstance.acceptPayment(2, 1, {from: landlord});

            let t2after = await leaseTokenInstance.checkLeaseToken(tenant2);
            console.log(`Tenant Balance After Rental Month ${i + 2}:` + t2after.toString())
        }

        let t2current = await leaseTokenInstance.checkLeaseToken(tenant2);
        //check if rental application is complete
        let application = await rentalMarketplaceInstance.getRentalApplication(2,1);
        assert.equal(application.status, 3, "Application status not COMPLETED");

        await rentalMarketplaceInstance.moveOut(2, 1, {from: tenant2});

        let t2end = await leaseTokenInstance.checkLeaseToken(tenant2);
        let expectedBalanceAfter = new web3.utils.BN(t2current).add(new web3.utils.BN(depositFee));
        assert.equal(t2end.toString(), expectedBalanceAfter.toString(), "Deposit Fee not refunded correctly");
        console.log("After Move Out + Deposit Fee:" + t2end.toString())
        
    });

    it("Test 18 (Success): Landlord unlist rental property", async () => {
        const landlordwallet = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Before Unlist Property:" + landlordwallet.toString())

        const result = await rentalMarketplaceInstance.unlistARentalProperty(2, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalPropertyUnlisted');

        //protection is standardised as 50 tokens
        const landlordwalletA = await leaseTokenInstance.checkLeaseToken(landlord);
        let expectedBalanceAfter = new web3.utils.BN(landlordwallet).add(new web3.utils.BN(50));
        assert.equal(landlordwalletA.toString(), expectedBalanceAfter.toString(), "Protection Fee not refunded correctly");
        console.log("After Unlist (Refund + full protection fee) :" + landlordwalletA.toString())
    });

    it("Test 19 (Success): Landlord convert LeaseToken to ETH", async () => {
        const landlordwallet = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Before Convert LeaseToken to ETH:" + landlordwallet.toString())

        const result = await leaseTokenInstance.convertLeaseTokenToETH(landlord, landlordwallet, {from: landlord});
        truffleAssert.eventEmitted(result, 'refundCredit');

        const landlordwalletA = await leaseTokenInstance.checkLeaseToken(landlord);
        assert.equal(landlordwalletA.toString(), "0", "LeaseToken not converted to ETH correctly");
        console.log("After Convert LeaseToken to ETH:" + landlordwalletA.toString())
    });


    

    
});



