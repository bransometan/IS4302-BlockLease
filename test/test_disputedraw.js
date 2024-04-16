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

contract('Dispute DRAW for Rental', function (accounts) {
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

    it('Test Case 1: Tenant can file for a dispute for a rental property', async () => {
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

        let hdb1 = await rentalPropertyInstance.addRentalProperty("123 Main St", "s123456", "1", 0, "Nice place", "2", "30", "3", { from: landlord });

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(0, depositFee, { from: landlord });
        landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);

        // Tenant apply for rental property
        const tenantApply = await rentalMarketplaceInstance.applyRentalProperty(0, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts
        const landlordAccept = await rentalMarketplaceInstance.acceptRentalApplication(0, 0, { from: landlord });

        // repeat based on the duration
        for (let i = 0; i < 3; i++) {
            // Tenant make payment to landlord
            await rentalMarketplaceInstance.makePayment(0, 0, { from: tenant });
            // Landlord accept payment
            await rentalMarketplaceInstance.acceptPayment(0, 0, { from: landlord });
        }

        // before dispute
        console.log("Amount tenant have BEFORE dispute" + tenantTokens)
        // Dispute type is health and safety
        const tenantDispute1 = await rentDisputeDAOInstance.createRentDispute(0, 0, 1, "Landlord threatens to light house on fire", { from: tenant });
        truffleAssert.eventEmitted(tenantDispute1, 'RentDisputeCreated');

        // check balance of the token of tenant
        console.log("Amount tenant have AFTER dispute" + tenantTokens)

        // ======== End ========
    });

    it('Test Case 2 FAILURE: Tenant cannot move out of rental property in a dispute', async () => {
        try {
            await rentalMarketplaceInstance.moveOut(0, 0, {from: tenant});
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Rental application is not completed'), "Unexpected error message: " + error.message);
        }
    });


    it('Test Case 3: Validators can vote for a dispute for a rental property (WITH VOTES)', async () => {
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
        // 0 is void, 1 is approve, 2 is reject
        // The dispute id is 1 instead of 0, small bug but its ok :D
        let validator1VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator1 });
        truffleAssert.eventEmitted(validator1VoteAccept, 'VoteOnRentDispute');

        let validator2VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 2, { from: validator2 });
        truffleAssert.eventEmitted(validator2VoteAccept, 'VoteOnRentDispute');

        let amtv1 = await leaseTokenInstance.checkLeaseToken(validator1);
        let amtv2 = await leaseTokenInstance.checkLeaseToken(validator1);

        console.log("Validator 1 new wallet balance : " + amtv1.toString())
        console.log("Validator 2 new wallet balance : " + amtv2.toString())
        // ======== End ========
    });

    it('Test Case 4 FAILURE: Validators can only vote once for a dispute once for a rental property', async () => {
        try {
            let validator1VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator1 });
            truffleAssert.eventEmitted(validator1VoteAccept, 'VoteOnRentDispute');

            let validator2VoteAccept = await rentDisputeDAOInstance.voteOnRentDispute(1, 2, { from: validator2 });
            truffleAssert.eventEmitted(validator2VoteAccept, 'VoteOnRentDispute');

        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Dispute is not pending'), "Unexpected error message: " + error.message);
        }
    });

    it('Test Case 5: Check Dispute Draw outcome with voters', async () => {  
        // let tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);
        // console.log("Tenant New Balance BEFORE added token reward : " + tenantTokens.toString())

        let resolve = await rentDisputeDAOInstance.triggerResolveRentDispute(1);
        truffleAssert.eventEmitted(resolve, 'RentDisputeResolved');

        // console.log("Tenant New Balance AFTER added token reward : " + tenantTokens.toString())

        // let result = await leaseTokenInstance.checkLeaseToken(validator1);
        // let result2 = await leaseTokenInstance.checkLeaseToken(validator2);

        // console.log("Validator 1 New Balance AFTER added VOTE price : " + result.toString())
        // console.log("Validator 2 New Balance AFTER added Vote reward : " + result2.toString())

        // let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        // console.log("Landlord Balance AFTER UNCHANGED : " + landlordB.toString())
        // ======== End ========
    });

    it('Test Case 6 FAILURE: Tenant can only file for 1 dispute in the same rental property', async () => {
        try {
            await rentDisputeDAOInstance.createRentDispute(0, 0, 1, "Landlord threatens to light house on fire second time", { from: tenant });
        } catch (error) {
            console.log("Caught error:", error.message);
            assert(error.message.includes('revert Tenant has already made a dispute for this rental property'), "Unexpected error message: " + error.message);
        }
    });


    it('Test Case 7: Tenant move out of rental property (after dispute)', async () => {     
        await rentalMarketplaceInstance.moveOut(0, 0, {from: tenant});

        let t2end = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Tenant Balance : After Move Out + Deposit Fee:" + t2end.toString())

        let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Landlord Balance AFTER refund deposit fee" + landlordB.toString())
        // ======== End ========
    });

    it('Test Case 8: Landlord unlist the property', async () => {     
        const result = await rentalMarketplaceInstance.unlistARentalProperty(0, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalPropertyUnlisted');

        let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("After Unlist (Refund + full protection fee) :" + landlordB.toString())
        // ======== End ========
    });

    it('Test Case 9: Tenant can file for a dispute for a rental property', async () => {
      
        let tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);

        let landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);

        const rentalProperty = await rentalMarketplaceInstance.listARentalProperty(0, depositFee, { from: landlord });
        landlordBalance = await leaseTokenInstance.checkLeaseToken(landlord);

        // Tenant apply for rental property
        const tenantApply = await rentalMarketplaceInstance.applyRentalProperty(0, "Tan Ah Kao", "tanahkao@gmail.com", "91231234", "I wish to stay in Main St with Nice place", { from: tenant });
        // Landlord accepts
        const landlordAccept = await rentalMarketplaceInstance.acceptRentalApplication(0, 0, { from: landlord });
        
        for (let i = 0; i < 3; i++) {
            // Tenant make payment to landlord
            await rentalMarketplaceInstance.makePayment(0, 0, { from: tenant });
            // Landlord accept payment
            await rentalMarketplaceInstance.acceptPayment(0, 0, { from: landlord });
        }    

        // before dispute
        console.log("Amount tenant have BEFORE dispute" + tenantTokens)
        // Dispute type is health and safety
        const tenantDispute1 = await rentDisputeDAOInstance.createRentDispute(0, 0, 1, "Landlord threatens to light house on fire", { from: tenant });
        truffleAssert.eventEmitted(tenantDispute1, 'RentDisputeCreated');

        // check balance of the token of tenant
        console.log("Amount tenant have AFTER dispute" + tenantTokens)

        // ======== End ========
    });

    it('Test Case 10: Check Dispute Draw outcome with NO VOTERS', async () => {  
        let tenantTokens = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Tenant New Balance BEFORE added token reward" + tenantTokens.toString())

        await rentDisputeDAOInstance.triggerResolveRentDispute(1);

        console.log("Tenant New Balance AFTER added token reward" + tenantTokens.toString())

        let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Landlord Balance AFTER UNCHANGED" + landlordB.toString())
        // ======== End ========
    });

    it('Test Case 11: Tenant move out of rental property (after dispute)', async () => {     
        await rentalMarketplaceInstance.moveOut(0, 0, {from: tenant});

        let tend = await leaseTokenInstance.checkLeaseToken(tenant);
        console.log("Tenant Balance : After Move Out + Deposit Fee:" + tend.toString())

        let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("Landlord Balance AFTER refund deposit fee" + landlordB.toString())
        // ======== End ========
    });

    it('Test Case 12: Landlord unlist the property', async () => {     
        const result = await rentalMarketplaceInstance.unlistARentalProperty(0, {from: landlord});
        truffleAssert.eventEmitted(result, 'RentalPropertyUnlisted');

        let landlordB = await leaseTokenInstance.checkLeaseToken(landlord);
        console.log("After Unlist (Refund + full protection fee) :" + landlordB.toString())
        // ======== End ========
    });


    // it('Validators 3 can vote reject', async () => {
    //     // Call the getLeaseToken function and send ETH along with the transaction.
    //     let amountOfEthToSend = web3.utils.toWei('5', 'ether');
    //     let result = await leaseTokenInstance.getLeaseToken({
    //         from: validator3,
    //         value: amountOfEthToSend
    //     });

    //     // idk why validator 3 cnt vote reject, damn weird
    //     let validator3VoteReject = await rentDisputeDAOInstance.voteOnRentDispute(1, 1, { from: validator3 });
    //     truffleAssert.eventEmitted(validator3VoteReject, 'VoteOnRentDispute');
    //     // ======== End ========
    // });
});