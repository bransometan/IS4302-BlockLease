// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RentalProperty.sol";
import "./RentalMarketplace.sol";
import "./PaymentEscrow.sol";

contract RentDisputeDAO {
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //

    enum DisputeStatus {
        PENDING,
        APPROVED,
        REJECTED,
        DRAW
    }

    enum DisputeType {
        MAINTENANCE_AND_REPAIRS,
        HEALTH_AND_SAFETY,
        PRIVACY,
        DISCRIMINATION,
        NOISE_COMPLAINTS,
        LEASE_TERMS,
        OTHER
    }

    enum Vote {
        VOID,
        APPROVE,
        REJECT
    }

    struct RentDispute {
        uint256 rentDisputeId; // Unique identifier for the dispute
        uint256 rentalPropertyId; // Unique identifier for the rental property
        uint256 applicationId; // Unique identifier for the rental application
        address tenantAddress; // Address of the tenant who created the dispute
        address landlordAddress; // Address of the landlord of the rental property
        uint256 startTime; // Start time of the dispute
        uint256 endTime; // End time of the dispute
        DisputeStatus status; // Status of the dispute (PENDING, APPROVED, REJECTED, DRAW)
        DisputeType disputeType; // Type of the dispute
        string disputeReason; // Reason for the dispute
    }

    RentalProperty rentalPropertyContract;
    PaymentEscrow paymentEscrowContract;
    RentalMarketplace rentalMarketplaceContract;

    // Minimum number of voters in a dispute
    uint256 private minNumOfVotersInDispute;

    // Track the number of disputes created
    uint256 private numOfDisputes = 0;
    // Track all disputes (disputeId => RentDispute)
    mapping(uint256 => RentDispute) private disputes;
    // Track all votes for a particular dispute (disputeId => address => Vote)
    mapping(uint256 => mapping(address => Vote)) private votesForDispute;
    // Track whether tenant has made a dispute for a particular rentalPropertyId (rentalPropertyId => address => bool)
    mapping(uint256 => mapping(address => bool)) private tenantDispute;
    // Track all voter addresses for a particular dispute (disputeId => address[])
    mapping(uint256 => address[]) private votersInDispute; // disputeId => address[]

    constructor(
        address _rentalPropertyContract,
        address _paymentEscrowContract,
        address _rentalMarketplaceContract,
        uint256 _minNumOfVotersInDispute
    ) {
        rentalPropertyContract = RentalProperty(_rentalPropertyContract);
        paymentEscrowContract = PaymentEscrow(_paymentEscrowContract);
        rentalMarketplaceContract = RentalMarketplace(
            _rentalMarketplaceContract
        );
        minNumOfVotersInDispute = _minNumOfVotersInDispute;
    }

    // ################################################### EVENTS ################################################### //

    event RentDisputeCreated(uint256 disputeId, RentDispute rentDispute);
    event VoteOnRentDispute(uint256 disputeId, address voter, Vote vote);
    event RentDisputeResolved(uint256 disputeId, RentDispute rentDispute);
    event DisputeApprovalReward(
        uint256 rentalPropertyId,
        uint256 applicationId,
        uint256 tenantReward
    );
    event DisputeRejectionReward(
        uint256 rentalPropertyId,
        uint256 applicationId,
        uint256 landlordReward
    );
    event DisputeDraw(uint256 rentalPropertyId, uint256 applicationId);
    event ReviewersReward(
        uint256 rentalPropertyId,
        uint256 applicationId,
        uint256 totalReviewers
    );

    // ################################################### MODIFIERS ################################################### //

    //Dispute status is pending
    modifier disputePending(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.PENDING,
            "Dispute is not pending"
        );
        _;
    }

    //Dispute status is approved
    modifier disputeApproved(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.APPROVED,
            "Dispute is not approved"
        );
        _;
    }

    //Dispute status is rejected
    modifier disputeRejected(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.REJECTED,
            "Dispute is not rejected"
        );
        _;
    }

    //Dispute status is draw
    modifier disputeDraw(uint256 _disputeId) {
        require(
            disputes[_disputeId].status == DisputeStatus.DRAW,
            "Dispute is not draw"
        );
        _;
    }

    //Voter has not voted
    modifier voterNotVoted(uint256 _disputeId, address _voter) {
        require(
            votesForDispute[_disputeId][_voter] == Vote.VOID,
            "Voter has already voted"
        );
        _;
    }

    // Dispute Exists
    modifier disputeExist(uint256 _disputeId) {
        require(
            _disputeId > 0 && _disputeId <= numOfDisputes,
            "Invalid dispute Id"
        );
        _;
    }

    //Tenant has not made a dispute for the rental property
    modifier tenantNotDisputed(uint256 _rentalPropertyId, address _tenant) {
        require(
            !tenantDispute[_rentalPropertyId][_tenant],
            "Tenant has already made a dispute for this rental property"
        );
        _;
    }

    //Tenant has made a dispute for the rental property
    modifier tenantDisputed(uint256 _rentalPropertyId, address _tenant) {
        require(
            tenantDispute[_rentalPropertyId][_tenant],
            "Tenant has not made a dispute for this rental property"
        );
        _;
    }

    // ################################################### FUNCTIONS ################################################### //

    function createRentDispute(
        uint256 _rentalPropertyId,
        uint256 _applicationId,
        DisputeType _disputeType,
        string memory _disputeReason
    ) public tenantNotDisputed(_rentalPropertyId, msg.sender) {
        RentalMarketplace.RentalApplication
            memory rentalApplication = rentalMarketplaceContract
                .getRentalApplication(_rentalPropertyId, _applicationId);

        require(
            rentalApplication.rentalPropertyId == _rentalPropertyId,
            "Invalid rental property"
        );

        require(
            rentalApplication.applicationId == _applicationId,
            "Invalid rental application"
        );

        require(
            rentalApplication.status == RentalMarketplace.RentStatus.COMPLETED,
            "Dispute can only be created by tenant after rental application is completed"
        );

        require(
            rentalApplication.tenantAddress == msg.sender,
            "Only tenant from this property can create a dispute"
        );

        // Tenant needs to stake the voter rewards (specified by PaymentEscorw) for the dispute for the winning reviewers
        // PaymentEscrow will hold the voter rewards until the dispute is resolved
        // Transfer the reward from tenant to PaymentEscrow
        transferPayment(
            msg.sender,
            address(paymentEscrowContract),
            paymentEscrowContract.getVoterReward()
        );

        numOfDisputes++;
        RentDispute memory rentDispute = RentDispute({
            rentDisputeId: numOfDisputes,
            rentalPropertyId: _rentalPropertyId,
            applicationId: _applicationId,
            tenantAddress: rentalApplication.tenantAddress,
            landlordAddress: rentalApplication.landlordAddress,
            startTime: block.timestamp,
            endTime: block.timestamp + 7 days,
            status: DisputeStatus.PENDING,
            disputeType: _disputeType,
            disputeReason: _disputeReason
        });

        // Add the rent dispute to disputes mapping
        disputes[numOfDisputes] = rentDispute;
        // Set tenantDispute to true for the rental property
        tenantDispute[_rentalPropertyId][msg.sender] = true;
        // Update the rental application status to DISPUTE
        rentalMarketplaceContract.updateRentalApplicationStatus(
            _rentalPropertyId,
            _applicationId,
            RentalMarketplace.RentStatus.DISPUTE
        );

        emit RentDisputeCreated(numOfDisputes, rentDispute);
    }

    // Reviewer can vote on a dispute
    function voteOnRentDispute(
        uint256 _disputeId,
        Vote _vote
    )
        public
        disputeExist(_disputeId)
        disputePending(_disputeId)
        voterNotVoted(_disputeId, msg.sender)
    {
        RentalMarketplace.RentalApplication
            memory rentalApplication = rentalMarketplaceContract
                .getRentalApplication(
                    disputes[_disputeId].rentalPropertyId,
                    disputes[_disputeId].applicationId
                );

        require(
            rentalApplication.landlordAddress != msg.sender &&
                rentalApplication.tenantAddress != msg.sender,
            "Landlord and Tenants are not authorized to vote"
        );

        // Check if the dispute has ended, if so, trigger the resolveRentDispute function
        // By default, we should use a time-based trigger to resolve the dispute
        // This is another way to resolve the dispute if the minimum number of voters in dispute is not reached within the time limit
        if (block.timestamp > disputes[_disputeId].endTime) {
            resolveRentDispute(_disputeId);
            return;
        }

        // Reviewer needs to stake a vote price (specified by PaymentEscorw)
        // PaymentEscrow will hold the vote price until the dispute is resolved
        // Transfer the reward from tenant to PaymentEscrow
        transferPayment(
            msg.sender,
            address(paymentEscrowContract),
            paymentEscrowContract.getVotePrice()
        );

        votesForDispute[_disputeId][msg.sender] = _vote;
        votersInDispute[_disputeId].push(msg.sender);

        emit VoteOnRentDispute(_disputeId, msg.sender, _vote);

        // Check if the number of voters in dispute is greater than the minimum number of voters in dispute
        // If so, trigger the resolveRentDispute function
        if (votersInDispute[_disputeId].length >= minNumOfVotersInDispute) {
            resolveRentDispute(_disputeId);
        }
    }

    // ################################################### TESTING METHODS ################################################### //

    // Manually trigger the resolveRentDispute function (for testing purposes only)
    function triggerResolveRentDispute(
        uint256 _disputeId
    ) public disputeExist(_disputeId) disputePending(_disputeId) {
        resolveRentDispute(_disputeId);
    }

    // Set tenantDispute to false for the rental property (for testing purposes only)
    function resetTenantDispute(
        uint256 _rentalPropertyId,
        address _tenant
    ) public tenantDisputed(_rentalPropertyId, _tenant) {
        tenantDispute[_rentalPropertyId][_tenant] = false;
    }

    // ################################################### INTERNAL METHODS ################################################### //

    // Resolve a rent dispute
    function resolveRentDispute(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputePending(_disputeId) {
        uint256 approveCount = 0;
        uint256 rejectCount = 0;

        for (uint256 i = 0; i < votersInDispute[_disputeId].length; i++) {
            if (
                votesForDispute[_disputeId][votersInDispute[_disputeId][i]] ==
                Vote.APPROVE
            ) {
                approveCount++;
            } else if (
                votesForDispute[_disputeId][votersInDispute[_disputeId][i]] ==
                Vote.REJECT
            ) {
                rejectCount++;
            }
        }

        if (approveCount > rejectCount) {
            disputes[_disputeId].status = DisputeStatus.APPROVED;
            handleDisputeApprovalReward(_disputeId);
        } else if (rejectCount > approveCount) {
            disputes[_disputeId].status = DisputeStatus.REJECTED;
            handleDisputeRejectionReward(_disputeId);
        } else {
            disputes[_disputeId].status = DisputeStatus.DRAW;
            handleDisputeDraw(_disputeId);
        }

        handleReviewersReward(_disputeId);

        // Clear votes for the dispute
        for (uint256 i = 0; i < votersInDispute[_disputeId].length; i++) {
            votesForDispute[_disputeId][votersInDispute[_disputeId][i]] = Vote
                .VOID;
        }
        // Clear voters for the dispute
        delete votersInDispute[_disputeId];

        // Update the rental application status to COMPLETED
        rentalMarketplaceContract.updateRentalApplicationStatus(
            disputes[_disputeId].rentalPropertyId,
            disputes[_disputeId].applicationId,
            RentalMarketplace.RentStatus.COMPLETED
        );

        emit RentDisputeResolved(_disputeId, disputes[_disputeId]);
    }

    // Handle rewards for tenant if the dispute is approved (i.e. tenant wins)
    // Tenant receives (1 / Total number of tenants in the rental property) * Rental Property Protection Fee as reward
    // Landlord loses (1 / Total number of tenants in the rental property) * Rental Property Protection Fee as penalty
    function handleDisputeApprovalReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeApproved(_disputeId) {
        RentDispute memory rentDispute = disputes[_disputeId];
        RentalMarketplace.RentalApplication
            memory rentalApplication = rentalMarketplaceContract
                .getRentalApplication(
                    rentDispute.rentalPropertyId,
                    rentDispute.applicationId
                );

        require(
            rentDispute.status == DisputeStatus.APPROVED,
            "Dispute is not approved"
        );

        uint256 totalTenants = rentalPropertyContract.getNumOfTenants(
            rentDispute.rentalPropertyId
        );
        uint256 protectionFee = paymentEscrowContract.getProtectionFee();
        uint256 tenantReward = protectionFee / totalTenants;

        // Get paymentId for protection fee transaction in the rental property
        uint256 paymentId = rentalPropertyContract.getPaymentId(
            rentDispute.rentalPropertyId
        );
        // Get payment from PaymentEscrow for the rental property
        PaymentEscrow.Payment memory payment = paymentEscrowContract.getPayment(
            paymentId
        );
        // Update Protection Fee balance for the rental property in PaymentEscrow
        paymentEscrowContract.updatePayment(
            paymentId,
            payment.payer,
            payment.payee,
            payment.amount - tenantReward,
            payment.status
        );

        // Transfer tenantReward from PaymentEscrow to tenant
        transferPayment(
            address(paymentEscrowContract),
            rentalApplication.tenantAddress,
            tenantReward
        );

        emit DisputeApprovalReward(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId,
            tenantReward
        );
    }

    // Handle rewards for landlord if the dispute is rejected (i.e. landlord wins)
    // Landlord will keep 50% of the Rental Property Deposit Fee (initially paid by tenant as deposit when applying for rental property) as reward
    // Tenant will lose 50% of the Rental Property Deposit Fee as penalty
    function handleDisputeRejectionReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeRejected(_disputeId){
        RentDispute memory rentDispute = disputes[_disputeId];
        require(
            rentDispute.status == DisputeStatus.REJECTED,
            "Dispute is not rejected"
        );

        // Get the initial Deposit Fee paid by tenant for the rental property
        uint256 depositFee = rentalMarketplaceContract.getDepositAmount(
            rentDispute.rentalPropertyId
        );
        // Get the new Deposit Fee balance for the rental property (50% of the initial Deposit Fee)
        uint256 newDepositFeeBalance = uint256(depositFee / 2);
        // Update Deposit Fee balance for the rental property in RentalMarketplace
        rentalMarketplaceContract.updateDepositFeeBalance(
            rentDispute.rentalPropertyId,
            newDepositFeeBalance
        );

        emit DisputeRejectionReward(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId,
            newDepositFeeBalance
        );
    }

    // Handle event where the dispute is draw
    // Refund Vote reward staked by tenant
    function handleDisputeDraw(
        uint256 _disputeId
    ) private disputeExist(_disputeId) disputeDraw(_disputeId) {
        RentDispute memory rentDispute = disputes[_disputeId];
        require(
            rentDispute.status == DisputeStatus.DRAW,
            "Dispute is not draw"
        );

        // Transfer the votePrice back to the tenant
        // Tenant will receive the voter reward staked earlier back as the dispute is a draw
        transferPayment(
            address(paymentEscrowContract),
            rentDispute.tenantAddress,
            paymentEscrowContract.getVoterReward()
        );

        emit DisputeDraw(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId
        );
    }

    // Handle reviewer's reward for voters who voted correctly on the dispute (i.e. winning reviewers)
    function handleReviewersReward(
        uint256 _disputeId
    ) private disputeExist(_disputeId) {
        RentDispute memory rentDispute = disputes[_disputeId];

        require(
            rentDispute.status != DisputeStatus.PENDING,
            "Dispute needs to be approved or rejected or draw"
        );

        // Get the total number of reviewers in the dispute
        uint256 totalReviewers = votersInDispute[_disputeId].length;

        // Get the total vote price for the dispute
        // Total vote price will be distributed among the winning reviewers
        // Total vote price will be refunded to the reviewers if the dispute is a draw
        uint256 totalVotePrice = paymentEscrowContract.getVotePrice() *
            totalReviewers;

        // If the dispute is approved, transfer the reward to the reviewers who voted correctly
        if (rentDispute.status == DisputeStatus.APPROVED) {
            uint256 totalCorrectVotes = 0;
            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.APPROVE
                ) {
                    totalCorrectVotes++;
                }
            }
            // Total rewards for the reviewers will be the sum of the voter reward and the total vote price
            uint256 totalRewards = paymentEscrowContract.getVoterReward() +
                totalVotePrice;
            // Total rewards will be distributed among the reviewers who voted correctly
            uint256 rewardPerCorrectVote = totalRewards / totalCorrectVotes;
            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.APPROVE
                ) {
                    transferPayment(
                        address(paymentEscrowContract),
                        votersInDispute[_disputeId][i],
                        rewardPerCorrectVote
                    );
                }
            }
        }
        // If the dispute is rejected, transfer the reward to the reviewers who voted correctly
        else if (rentDispute.status == DisputeStatus.REJECTED) {
            uint256 totalCorrectVotes = 0;
            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.REJECT
                ) {
                    totalCorrectVotes++;
                }
            }
            // Total rewards for the reviewers will be the sum of the voter reward and the total vote price
            uint256 totalRewards = paymentEscrowContract.getVoterReward() +
                totalVotePrice;
            // Total rewards will be distributed among the reviewers who voted correctly
            uint256 rewardPerCorrectVote = totalRewards / totalCorrectVotes;
            for (uint256 i = 0; i < totalReviewers; i++) {
                if (
                    votesForDispute[_disputeId][
                        votersInDispute[_disputeId][i]
                    ] == Vote.REJECT
                ) {
                    transferPayment(
                        address(paymentEscrowContract),
                        votersInDispute[_disputeId][i],
                        rewardPerCorrectVote
                    );
                }
            }
        }
        // If the dispute is a draw, transfer the votePrice back to the reviewers (no reward for the reviewers in a draw dispute)
        else if (rentDispute.status == DisputeStatus.DRAW) {
            // Transfer the votePrice back to the reviewers
            for (uint256 i = 0; i < totalReviewers; i++) {
                transferPayment(
                    address(paymentEscrowContract),
                    votersInDispute[_disputeId][i],
                    paymentEscrowContract.getVotePrice()
                );
            }
        }

        emit ReviewersReward(
            rentDispute.rentalPropertyId,
            rentDispute.applicationId,
            totalReviewers
        );
    }

    // Create a payment transaction between two parties
    function transferPayment(
        address from,
        address to,
        uint256 amount
    ) private returns (uint256) {
        // Create a payment transaction between two parties
        uint256 paymentId = paymentEscrowContract.createPayment(
            from,
            to,
            amount
        );
        // Pay the payment transaction
        paymentEscrowContract.pay(paymentId);
        // Release the payment transaction
        paymentEscrowContract.release(paymentId);
        return paymentId;
    }

    // ################################################### GETTER METHODS ################################################### //

    // Get rent dispute details
    function getRentDispute(
        uint256 _disputeId
    ) public view returns (RentDispute memory) {
        return disputes[_disputeId];
    }

    // Get number of disputes
    function getNumOfDisputes() public view returns (uint256) {
        return numOfDisputes;
    }

    // Get number of disputes by landlord address
    function getNumOfDisputesByLandlord(
        address _landlordAddress
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].landlordAddress == _landlordAddress) {
                count++;
            }
        }
        return count;
    }

    // Get number of disputes by tenant address
    function getNumOfDisputesByTenant(
        address _tenantAddress
    ) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].tenantAddress == _tenantAddress) {
                count++;
            }
        }
        return count;
    }

    // Get all disputes
    function getAllDisputes() public view returns (RentDispute[] memory) {
        RentDispute[] memory allDisputes = new RentDispute[](numOfDisputes);
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            allDisputes[i - 1] = disputes[i];
        }
        return allDisputes;
    }

    // Get all disputes by landlord address
    function getDisputesByLandlord(
        address _landlordAddress
    ) public view returns (RentDispute[] memory) {
        uint256 numOfLandlordDisputes = getNumOfDisputesByLandlord(
            _landlordAddress
        );
        RentDispute[] memory landlordDisputes = new RentDispute[](
            numOfLandlordDisputes
        );
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].landlordAddress == _landlordAddress) {
                landlordDisputes[count] = disputes[i];
                count++;
            }
        }
        return landlordDisputes;
    }

    // Get all disputes by tenant address
    function getDisputesByTenant(
        address _tenantAddress
    ) public view returns (RentDispute[] memory) {
        uint256 numOfTenantDisputes = getNumOfDisputesByTenant(_tenantAddress);
        RentDispute[] memory tenantDisputes = new RentDispute[](
            numOfTenantDisputes
        );
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfDisputes; i++) {
            if (disputes[i].tenantAddress == _tenantAddress) {
                tenantDisputes[count] = disputes[i];
                count++;
            }
        }
        return tenantDisputes;
    }
}
