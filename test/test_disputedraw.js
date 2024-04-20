/*
Description: Test cases for dispute DRAW for rental property (No Winner)
Roles: 1 Tenant, 1 Landlord, 2 Validator
Run Command: truffle test ./test/test_disputedraw.js
Test Cases (12):
----------------------Draw outcome with voters-----------------------
1. Tenant can file for a dispute for a rental property
2. Tenant cannot move out of rental property in a dispute
3. Validators can vote for a dispute for a rental property (3 VALIDATORS)
4. Validators can only vote once for a dispute once for a rental property
5. Check Dispute DRAW outcome with voters
6. Tenant can only file for 1 dispute in the same rental property
7. Tenant move out of rental property (after dispute)
8. Landlord unlist the property
----------------------Draw outcome with NO VOTERS-----------------------
9. Tenant can file for a dispute for a rental property
10. Check Dispute Draw outcome with NO VOTERS
11. Tenant move out of rental property (after dispute)
12. Landlord unlist the property
*/

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

contract('Dispute DRAW for Rental', function (accounts) {
    let leaseTokenInstance, paymentEscrowInstance, rentalMarketplaceInstance, rentalPropertyInstance, rentDisputeDAOInstance;

    const landlord = accounts[1];
    const tenant = accounts[2];
    const validator1 = accounts[3];
    const validator2 = accounts[4];
    const validator3 = accounts[5];
    const depositFee = 50;

    before(async () => {
        leaseTokenInstance = await LeaseToken.deployed();
        paymentEscrowInstance = await PaymentEscrow.deployed();
        rentalMarketplaceInstance = await RentalMarketplace.deployed();
        rentalPropertyInstance = await RentalProperty.deployed();
        rentDisputeDAOInstance = await RentDisputeDAO.deployed();
    });

    it('Test 1 (Success): Tenant can file for a dispute for a rental property', async () => {

        /* ------------------------Start of Initial Setup----------------------- */

        // Amount of ETH to send to the contract
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');

        // Get lease token for landlord and tenant
        await leaseTokenInstance.getLeaseToken({
            from: landlord,
            value: amountOfEthToSend
        });

        await leaseTokenInstance.getLeaseToken({
            from: tenant,
            value: amountOfEthToSend
        });

        // Create a rental property
        await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "1", 0, "Nice place", "2", "30", "3", { from: landlord });

        // List the rental property
        await rentalMarketplaceInstance.listARentalProperty(0, depositFee, { from: landlord });

        // Tenant apply for rental property
        await rentalMarketplaceInstance.applyRentalProperty(0, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts the rental application
        await rentalMarketplaceInstance.acceptRentalApplication(0, 0, { from: landlord });

        // Tenant make payment to landlord and landlord accept payment for 3 months (until end of lease period)
        for (let i = 0; i < 3; i++) {
            // Tenant make payment to landlord
            await rentalMarketplaceInstance.makePayment(0, 0, { from: tenant });
            // Landlord accept payment
            await rentalMarketplaceInstance.acceptPayment(0, 0, { from: landlord });
        }

        /* ------------------------End of Initial Setup----------------------- */

        /* ------------------------Start of Create Dispute----------------------- */
        // Check the balance of the tenant wallet
        const tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Amount tenant have BEFORE dispute : " + tenantTokens)

        // Tenant file for a dispute
        const tenantDispute1 = await rentDisputeDAOInstance.createRentDispute(0, 0, 1, "Landlord threatens to light house on fire", { from: tenant });
        // Check if the event was emitted
        truffleAssert.eventEmitted(tenantDispute1, 'RentDisputeCreated');

        // check balance of the token of tenant
        const tokenafter = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Amount tenant have AFTER dispute : " + tokenafter.toString())

        // Get the voter reward that the tenant needs to stake for the dispute
        const voterReward = await paymentEscrowInstance.getVoterReward();
        // Check if token balance is deducted correctly
        let expectedBalanceAfter = new web3.utils.BN(tenantTokens).sub(new web3.utils.BN(voterReward));
        assert.equal(tokenafter.toString(), expectedBalanceAfter.toString(), "Token balance not deducted correctly");

        /* ------------------------End of Create Dispute----------------------- */
    });

    it('Test 2 (Failure): Tenant cannot move out of rental property in a dispute', async () => {
        // Tenant move out of rental property in a dispute (should fail)
        try {
            await rentalMarketplaceInstance.moveOut(0, 0, {from: tenant});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental application is not completed'), "Unexpected error message: " + error.message);
        }
    });

    it('Test 3 (Success): Validators can vote for a dispute for a rental property (3 VALIDATORS)', async () => {
        // Get lease token for validators
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');
        await leaseTokenInstance.getLeaseToken({
            from: validator1,
            value: amountOfEthToSend
        });
        await leaseTokenInstance.getLeaseToken({
            from: validator2,
            value: amountOfEthToSend
        });

        // Get current balance of the validators wallet
        let amtv1Before = await leaseTokenInstance.checkLeaseToken(validator1);
        let amtv2Before = await leaseTokenInstance.checkLeaseToken(validator2);
        
        console.log("Validator 1 current wallet balance : " + amtv1Before.toString())
        console.log("Validator 2 current wallet balance : " + amtv2Before.toString())
        
        /* 0 is void, 1 is approve, 2 is reject
        Note: disputeId starts from 1 (0 is used to indicate no dispute)
        Note: 1 validators approve, 1 validator reject.*/
        // Validator 1 approve
        let validator1VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator1 });
        // Check if the event was emitted
        truffleAssert.eventEmitted(validator1VoteAccept, 'VoteOnRentDispute');

        // Validator 2 reject
        let validator2VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 2, { from: validator2 });
        // Check if the event was emitted
        truffleAssert.eventEmitted(validator2VoteAccept, 'VoteOnRentDispute');

        // Check the new balance of the validators wallet
        let amtv1After = await leaseTokenInstance.checkLeaseToken(validator1);
        let amtv2After = await leaseTokenInstance.checkLeaseToken(validator2);

        // Get Vote Price from Payment Escrow for validators to participate in voting
        let votePrice = await paymentEscrowInstance.getVotePrice();
        // Get the expected balance after deducting the vote price
        let expectedBalanceAfter1 = new web3.utils.BN(amtv1Before).sub(new web3.utils.BN(votePrice));
        let expectedBalanceAfter2 = new web3.utils.BN(amtv2Before).sub(new web3.utils.BN(votePrice));

        // Check if token balance is deducted correctly
        assert.equal(amtv1After.toString(), expectedBalanceAfter1.toString(), "Token balance not deducted correctly for validator 1");
        assert.equal(amtv2After.toString(), expectedBalanceAfter2.toString(), "Token balance not deducted correctly for validator 2");

        console.log("Validator 1 new wallet balance : " + amtv1After.toString());
        console.log("Validator 2 new wallet balance : " + amtv2After.toString());
    });

    it('Test 4 (Success): Validators can only vote once for a dispute once for a rental property', async () => {

        // Validator 1, 2 and 3 vote again (should fail)
        try {
            let validator1Vote = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator1 });
            truffleAssert.eventEmitted(validator1Vote, 'VoteOnRentDispute');

            let validator2Vote = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator2 });
            truffleAssert.eventEmitted(validator2Vote, 'VoteOnRentDispute');

        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Voter has already voted'), "Unexpected error message: " + error.message);
        }
    });

    it('Test 5 (Success): Check Dispute DRAW outcome with voters', async () => {  

        // Get vote price from Payment Escrow
        let votePriceRefund = await paymentEscrowInstance.getVotePrice();
        // Get the voter reward refund that the tenant stake
        let voterRewardRefund = await paymentEscrowInstance.getVoterReward();
    
        // Get tenant balance before dispute
        let tenantTokensBefore = await leaseTokenInstance.checkLeaseToken(tenant);
        // Get landlord balance before dispute
        let landlordTokensBefore = await leaseTokenInstance.checkLeaseToken(landlord);
        // Get validator 1 balance before dispute
        let validator1TokensBefore = await leaseTokenInstance.checkLeaseToken(validator1);
        // Get validator 2 balance before dispute
        let validator2TokensBefore = await leaseTokenInstance.checkLeaseToken(validator2);

        console.log("Tenant Balance BEFORE dispute : " + tenantTokensBefore.toString());
        console.log("Landlord Balance BEFORE dispute : " + landlordTokensBefore.toString());
        console.log("Validator 1 Balance BEFORE dispute : " + validator1TokensBefore.toString());
        console.log("Validator 2 Balance BEFORE dispute : " + validator2TokensBefore.toString());

        // Resolve the dispute (Triggered manually for testing purposes)
        let resolve = await rentDisputeDAOInstance.triggerResolveRentDispute(1);
        truffleAssert.eventEmitted(resolve, 'RentDisputeResolved');

        // Check the new balance of the tenant wallet
        let tenantTokensafter = await leaseTokenInstance.checkLeaseToken(tenant);
        // Check the new balance of the landlord wallet
        let landlordTokensafter = await leaseTokenInstance.checkLeaseToken(landlord);
        // Check the new balance of the winning validator 1 wallet
        let validator1Tokensafter = await leaseTokenInstance.checkLeaseToken(validator1);
        // Check the new balance of the winning validator 2 wallet
        let validator2Tokensafter = await leaseTokenInstance.checkLeaseToken(validator2);

        console.log("Tenant New Balance AFTER dispute : " + tenantTokensafter.toString());
        console.log("Landlord New Balance AFTER dispute : " + landlordTokensafter.toString());
        console.log("Validator 1 New Balance BEFORE added VOTE commision : " + validator1Tokensafter.toString());
        console.log("Validator 2 New Balance BEFORE added Vote commison : " + validator2Tokensafter.toString());

        // Get the expected balance after adding the rewards
        let expectedBalanceAfterTenant = new web3.utils.BN(tenantTokensBefore).add(new web3.utils.BN(voterRewardRefund));
        let expectedBalanceAfterLandlord = new web3.utils.BN(landlordTokensBefore);
        let expectedBalanceAfterValidator1 = new web3.utils.BN(validator1TokensBefore).add(new web3.utils.BN(votePriceRefund));
        let expectedBalanceAfterValidator2 = new web3.utils.BN(validator2TokensBefore).add(new web3.utils.BN(votePriceRefund));

        // Check if token balance is deducted correctly
        assert.equal(tenantTokensafter.toString(), expectedBalanceAfterTenant.toString(), "Token balance not added correctly for tenant");
        assert.equal(landlordTokensafter.toString(), expectedBalanceAfterLandlord.toString(), "Token balance not deducted correctly for landlord");
        assert.equal(validator1Tokensafter.toString(), expectedBalanceAfterValidator1.toString(), "Token balance not added correctly for validator 1");
        assert.equal(validator2Tokensafter.toString(), expectedBalanceAfterValidator2.toString(), "Token balance not added correctly for validator 2");
    });

    it('Test 6 (Failure): Tenant can only file for 1 dispute in the same rental property', async () => {
        // Tenant file for a dispute again (should fail)
        try {
            await rentDisputeDAOInstance.createRentDispute(0, 0, 1, "Landlord threatens to light house on fire second time", { from: tenant });
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Tenant has already made a dispute for this rental property'), "Unexpected error message: " + error.message);
        }
    });


    it('Test 7 (Success): Tenant move out of rental property (after dispute)', async () => {  
        // Get the current balance of the tenant wallet
        let t2current = await leaseTokenInstance.checkLeaseToken(tenant);
        // Get the current balance of the landlord wallet
        let landlordbefore = await leaseTokenInstance.checkLeaseToken(landlord);
        // Get rental application details
        let application = await rentalMarketplaceInstance.getRentalApplication(0,0);
        // Check that application status is COMPLETED to allow tenant to move out
        assert.equal(application.status, 3, "Application status not COMPLETED");

        console.log("Tenant Balance : Before Move Out : " + t2current.toString())
        console.log("Landlord Balance : Before Move Out : " + landlordbefore.toString())

        // Tenant move out of rental property
        await rentalMarketplaceInstance.moveOut(0, 0, {from: tenant});

        // Check the new balance of the tenant wallet
        let t2after = await leaseTokenInstance.checkLeaseToken(tenant);
        // Check the new balance of the landlord wallet
        let landlordAfter = await leaseTokenInstance.checkLeaseToken(landlord);

        // Get the expected balance after moving out
        let expectedTenantBalanceAfter = new web3.utils.BN(t2current).add(new web3.utils.BN(depositFee));
        let expectedLandlordBalanceAfter = new web3.utils.BN(landlordbefore).sub(new web3.utils.BN(depositFee));
        assert.equal(t2after.toString(), expectedTenantBalanceAfter.toString(), "Deposit Fee not refunded correctly to Tenant");
        assert.equal(landlordAfter.toString(), expectedLandlordBalanceAfter.toString(), "Deposit Fee not refunded correctly From Landlord");
        
        console.log("Tenant Balance : After Move Out + Deposit Fee : " + t2after.toString())
        console.log("Landlord Balance : After Move Out : " + landlordAfter.toString())
    });

    it('Test 8 (Success): Landlord unlist the property', async () => {
        // Get the remaining protection fee (remain unchanged since dispute draw)
        let remainingProtectionFee = await paymentEscrowInstance.getProtectionFee();

        // Get the current balance of the landlord wallet
        const landlordWalletBefore = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Before Unlist Property Token Balance:" + landlordWalletBefore.toString());

        // Unlist the rental property
        const result = await rentalMarketplaceInstance.unlistARentalProperty(0, {from: landlord});
        // Check if the event was emitted
        truffleAssert.eventEmitted(result, 'RentalPropertyUnlisted');

        // Get the new balance of the landlord wallet
        let landlordWalletAfter = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("After Unlist Property Token Balance (Get remaining protection fee)) :" + landlordWalletAfter.toString());

        // Get the expected balance after unlisting the property
        let expectedLandlordBalanceAfter = new web3.utils.BN(landlordWalletBefore).add(new web3.utils.BN(remainingProtectionFee));

        // Check if token balance is added correctly
        assert.equal(landlordWalletAfter.toString(), expectedLandlordBalanceAfter.toString(), "Protection Fee not refunded correctly to Landlord");
    });

    it('Test 9 (Success): Tenant can file for a dispute for a rental property', async () => {
        /* ------------------------Start of Initial Setup----------------------- */

        // Amount of ETH to send to the contract
        let amountOfEthToSend = web3.utils.toWei('5', 'ether');

        // Get lease token for landlord and tenant
        await leaseTokenInstance.getLeaseToken({
            from: landlord,
            value: amountOfEthToSend
        });

        await leaseTokenInstance.getLeaseToken({
            from: tenant,
            value: amountOfEthToSend
        });

        // Create a rental property
        await rentalPropertyInstance.addRentalProperty("545 Main St", "s144456", "1", 0, "Dope place", "2", "20", "3", { from: landlord });

        // List the rental property
        await rentalMarketplaceInstance.listARentalProperty(1, depositFee, { from: landlord });

        // Tenant apply for rental property
        await rentalMarketplaceInstance.applyRentalProperty(1, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts the rental application
        await rentalMarketplaceInstance.acceptRentalApplication(1, 0, { from: landlord });

        // Tenant make payment to landlord and landlord accept payment for 3 months (until end of lease period)
        for (let i = 0; i < 3; i++) {
            // Tenant make payment to landlord
            await rentalMarketplaceInstance.makePayment(1, 0, { from: tenant });
            // Landlord accept payment
            await rentalMarketplaceInstance.acceptPayment(1, 0, { from: landlord });
        }

        /* ------------------------End of Initial Setup----------------------- */

        /* ------------------------Start of Create Dispute----------------------- */
        // Check the balance of the tenant wallet
        const tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Amount tenant have BEFORE dispute : " + tenantTokens)

        // Tenant file for a dispute
        const tenantDispute1 = await rentDisputeDAOInstance.createRentDispute(1, 0, 1, "Landlord threatens to light house on fire", { from: tenant });
        // Check if the event was emitted
        truffleAssert.eventEmitted(tenantDispute1, 'RentDisputeCreated');

        // check balance of the token of tenant
        const tokenafter = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Amount tenant have AFTER dispute : " + tokenafter.toString())

        // Get the voter reward that the tenant needs to stake for the dispute
        const voterReward = await paymentEscrowInstance.getVoterReward();
        // Check if token balance is deducted correctly
        let expectedBalanceAfter = new web3.utils.BN(tenantTokens).sub(new web3.utils.BN(voterReward));
        assert.equal(tokenafter.toString(), expectedBalanceAfter.toString(), "Token balance not deducted correctly");

        /* ------------------------End of Create Dispute----------------------- */
    });

    it('Test 10 (Success): Check Dispute Draw outcome with NO VOTERS', async () => {  
        // Get the voter reward refund that the tenant stake
        let voterRewardRefund = await paymentEscrowInstance.getVoterReward();
    
        // Get tenant balance before dispute
        let tenantTokensBefore = await leaseTokenInstance.checkLeaseToken(tenant);
        // Get landlord balance before dispute
        let landlordTokensBefore = await leaseTokenInstance.checkLeaseToken(landlord);

        console.log("Tenant Balance BEFORE dispute : " + tenantTokensBefore.toString());
        console.log("Landlord Balance BEFORE dispute : " + landlordTokensBefore.toString());

        // Resolve the dispute (Triggered manually for testing purposes)
        let resolve = await rentDisputeDAOInstance.triggerResolveRentDispute(2);
        truffleAssert.eventEmitted(resolve, 'RentDisputeResolved');

        // Check the new balance of the tenant wallet
        let tenantTokensafter = await leaseTokenInstance.checkLeaseToken(tenant);
        // Check the new balance of the landlord wallet
        let landlordTokensafter = await leaseTokenInstance.checkLeaseToken(landlord);

        console.log("Tenant New Balance AFTER dispute : " + tenantTokensafter.toString());
        console.log("Landlord New Balance AFTER dispute : " + landlordTokensafter.toString());

        // Get the expected balance after adding the rewards
        let expectedBalanceAfterTenant = new web3.utils.BN(tenantTokensBefore).add(new web3.utils.BN(voterRewardRefund));
        let expectedBalanceAfterLandlord = new web3.utils.BN(landlordTokensBefore);

        // Check if token balance is deducted correctly
        assert.equal(tenantTokensafter.toString(), expectedBalanceAfterTenant.toString(), "Token balance not added correctly for tenant");
        assert.equal(landlordTokensafter.toString(), expectedBalanceAfterLandlord.toString(), "Token balance not deducted correctly for landlord");
    });

    it('Test 11 (Success): Tenant move out of rental property (after dispute)', async () => {  
        // Get the current balance of the tenant wallet
        let t2current = await leaseTokenInstance.checkLeaseToken(tenant);
        // Get the current balance of the landlord wallet
        let landlordbefore = await leaseTokenInstance.checkLeaseToken(landlord);
        // Get rental application details
        let application = await rentalMarketplaceInstance.getRentalApplication(1,0);
        // Check that application status is COMPLETED to allow tenant to move out
        assert.equal(application.status, 3, "Application status not COMPLETED");

        console.log("Tenant Balance : Before Move Out : " + t2current.toString())
        console.log("Landlord Balance : Before Move Out : " + landlordbefore.toString())

        // Tenant move out of rental property
        await rentalMarketplaceInstance.moveOut(1, 0, {from: tenant});

        // Check the new balance of the tenant wallet
        let t2after = await leaseTokenInstance.checkLeaseToken(tenant);
        // Check the new balance of the landlord wallet
        let landlordAfter = await leaseTokenInstance.checkLeaseToken(landlord);

        // Get the expected balance after moving out
        let expectedTenantBalanceAfter = new web3.utils.BN(t2current).add(new web3.utils.BN(depositFee));
        let expectedLandlordBalanceAfter = new web3.utils.BN(landlordbefore).sub(new web3.utils.BN(depositFee));
        assert.equal(t2after.toString(), expectedTenantBalanceAfter.toString(), "Deposit Fee not refunded correctly to Tenant");
        assert.equal(landlordAfter.toString(), expectedLandlordBalanceAfter.toString(), "Deposit Fee not refunded correctly From Landlord");
        
        console.log("Tenant Balance : After Move Out + Deposit Fee : " + t2after.toString())
        console.log("Landlord Balance : After Move Out : " + landlordAfter.toString())
    });

    it('Test 12 (Success): Landlord unlist the property', async () => {
        // Get the remaining protection fee (remain unchanged since dispute draw)
        let remainingProtectionFee = await paymentEscrowInstance.getProtectionFee();

        // Get the current balance of the landlord wallet
        const landlordWalletBefore = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Before Unlist Property Token Balance:" + landlordWalletBefore.toString());

        // Unlist the rental property
        const result = await rentalMarketplaceInstance.unlistARentalProperty(1, {from: landlord});
        // Check if the event was emitted
        truffleAssert.eventEmitted(result, 'RentalPropertyUnlisted');

        // Get the new balance of the landlord wallet
        let landlordWalletAfter = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("After Unlist Property Token Balance (Get remaining protection fee)) :" + landlordWalletAfter.toString());

        // Get the expected balance after unlisting the property
        let expectedLandlordBalanceAfter = new web3.utils.BN(landlordWalletBefore).add(new web3.utils.BN(remainingProtectionFee));

        // Check if token balance is added correctly
        assert.equal(landlordWalletAfter.toString(), expectedLandlordBalanceAfter.toString(), "Protection Fee not refunded correctly to Landlord");
    });

});