// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RentalProperty.sol";
import "./PaymentEscrow.sol";

contract RentalMarketplace {
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //

    enum RentStatus {
        PENDING, // This is when a tenant apply for a rental property and waiting for landlord to accept
        ONGOING, // This is when a tenant sign a rental agreement and the rental is ongoing
        MADE_PAYMENT, // This is when the tenant paid for a monthly rent and waiting for landlord to accept
        COMPLETED // This is when the rental is completed for the tenant (e.g. tenant move out and landlord return deposit if any)
    }

    struct RentalApplication {
        uint256 rentalPropertyId; // The rental property id
        uint256 applicationId; // The rental application id
        address tenantAddress; // The tenant
        string tenantName; // The tenant name
        string tenantEmail; // The tenant email
        string tenantPhone; // The tenant contact
        string description; // The tenant description of why they want to rent the property
        uint256 monthsPaid; // The number of months the tenant has paid
        RentStatus status; // The status of the rental application
        uint256[] paymentIds; // All the payment transaction ids generated for tenant during deposit/monthlyPayment of rental property (mainly to keep track of payments/refunds for deposit and monthly rent)
    }

    RentalProperty rentalPropertyContract;
    PaymentEscrow paymentEscrowContract;

    // This is mapping of RentalProperty id to the downpayment/deposit of the property
    mapping(uint256 => uint256) private rentalPropertyDeposits;
    // This is mapping of RentalProperty id to the (RentalApplication id to RentalApplication struct) mapping
    mapping(uint256 => mapping(uint256 => RentalApplication))
        private rentalApplications;
    // This is to keep track of the number of applications for a rental property (RentalProperty id to number of applications mapping)
    mapping(uint256 => uint256) private rentalApplicationCounts;
    // This is to keep track if a tenant has already applied for a rental property
    mapping(uint256 => mapping(address => bool)) private hasApplied;

    constructor(address rentalPropertyAddress, address paymentEscrowAddress) {
        rentalPropertyContract = RentalProperty(rentalPropertyAddress);
        paymentEscrowContract = PaymentEscrow(paymentEscrowAddress);
    }

    // ################################################### EVENTS ################################################### //

    event RentalPropertyListed(uint256 rentalPropertyId, uint256 depositFee);
    event RentalPropertyUnlisted(uint256 rentalPropertyId);
    event RentalApplicationSubmitted(
        uint256 rentalPropertyId,
        uint256 applicationId
    );
    event RentalApplicationRejected(
        uint256 rentalPropertyId,
        uint256 applicationId
    );
    event RentalApplicationAccepted(
        uint256 rentalPropertyId,
        uint256 applicationId
    );

    event PaymentMade(uint256 rentalPropertyId, uint256 applicationId);
    event PaymentAccepted(uint256 rentalPropertyId, uint256 applicationId);
    event tenantMoveOut(uint256 rentalPropertyId, uint256 applicationId);

    // ################################################### MODIFIERS ################################################### //

    // Modifier to check the landlord is the owner of the rental property
    modifier landlordOnly(uint256 rentalPropertyId) {
        require(
            msg.sender == rentalPropertyContract.getLandlord(rentalPropertyId),
            "Only landlord can perform this action"
        );
        _;
    }

    // Modifier to check the rental property is listed
    modifier rentalPropertyListed(uint256 rentalPropertyId) {
        require(
            rentalPropertyContract.getListedStatus(rentalPropertyId) == true,
            "Rental property is not listed"
        );
        _;
    }

    // Modifier to check the rental property is not listed
    modifier rentalPropertyNotListed(uint256 rentalPropertyId) {
        require(
            rentalPropertyContract.getListedStatus(rentalPropertyId) == false,
            "Rental property is already listed"
        );
        _;
    }

    // Modifier to check the rental application exist
    modifier rentalApplicationExist(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) {
        require(
            rentalApplications[rentalPropertyId][applicationId].tenantAddress !=
                address(0),
            "Rental application does not exist"
        );
        _;
    }

    // Modifier to check the rental application is pending
    modifier rentalApplicationPending(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) {
        require(
            rentalApplications[rentalPropertyId][applicationId].status ==
                RentStatus.PENDING,
            "Rental application is not pending"
        );
        _;
    }

    // Modifier to check the rental application is ongoing
    modifier rentalApplicationOngoing(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) {
        require(
            rentalApplications[rentalPropertyId][applicationId].status ==
                RentStatus.ONGOING,
            "Rental application is not ongoing"
        );
        _;
    }

    // Modifier to check the rental application is made payment
    modifier rentalApplicationMadePayment(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) {
        require(
            rentalApplications[rentalPropertyId][applicationId].status ==
                RentStatus.MADE_PAYMENT,
            "Tenant has not made payment"
        );
        _;
    }

    // Modifier to check the rental application is completed
    modifier rentalApplicationCompleted(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) {
        require(
            rentalApplications[rentalPropertyId][applicationId].status ==
                RentStatus.COMPLETED,
            "Rental application is not completed"
        );
        _;
    }

    // Modifier to check the rental property is vacant
    modifier rentalPropertyVacant(uint256 rentalPropertyId) {
        require(
            rentalApplicationCounts[rentalPropertyId] == 0,
            "Rental property is not vacant"
        );
        _;
    }

    // Modifier to check the number of rental applications is less than the number of tenants
    modifier rentalPropertyNotFull(uint256 rentalPropertyId) {
        require(
            rentalApplicationCounts[rentalPropertyId] <
                rentalPropertyContract.getNumOfTenants(rentalPropertyId),
            "Rental property is full"
        );
        _;
    }

    // Modifier to check the tenant has not applied for the rental property
    modifier tenantNotApplied(uint256 rentalPropertyId) {
        require(
            !hasApplied[rentalPropertyId][msg.sender],
            "Tenant has already applied for this rental property"
        );
        _;
    }

    // Modifier to check the tenant has applied for the rental property
    modifier tenantApplied(uint256 rentalPropertyId) {
        require(
            hasApplied[rentalPropertyId][msg.sender],
            "Tenant has not applied for this rental property"
        );
        _;
    }

    // Modifier to check Deposit LeaseToken is greater than 0
    modifier depositFeeGreaterThanZero(uint256 depositFee) {
        require(depositFee > 0, "Deposit LeaseToken must be greater than 0");
        _;
    }

    // ################################################### FUNCTIONS ################################################### //

    //Landlord can list a rental property to the marketplace to start accepting tenants.
    function listARentalProperty(
        uint256 rentalPropertyId,
        uint256 depositFee
    )
        public
        rentalPropertyNotListed(rentalPropertyId)
        depositFeeGreaterThanZero(depositFee)
        landlordOnly(rentalPropertyId)
    {
        // Protection fee (in LeaseToken) set by PaymentEscrow Contract required for listing of the rental property (to protect the landlord from potential disputes)
        uint256 protectionFee = paymentEscrowContract.getProtectionFee();
        
        // Create a payment transaction between landlord and PaymentEscrow contract
        uint256 paymentId = createPaymentTransaction(
            msg.sender, // Landlord
            address(paymentEscrowContract), // PaymentEscrow Contract
            protectionFee // Protection fee (LeaseToken) required for listing of the rental property
        );

        // Set the payment transaction id to the rental property
        rentalPropertyContract.setPaymentId(rentalPropertyId, paymentId);
        // Deposit fee (in LeaseToken) set by Landlord required for the rental property (to be paid by tenant if they apply for the rental property)
        rentalPropertyDeposits[rentalPropertyId] = depositFee;
        // Set the rental property as listed
        rentalPropertyContract.setListedStatus(rentalPropertyId, true);
        // Increment the number of listed rental properties
        rentalPropertyContract.incrementListedRentalProperty();
        emit RentalPropertyListed(rentalPropertyId, depositFee);
    }

    //Landlord can unlist a rental property from the marketplace to stop accepting tenants.
    function unlistARentalProperty(
        uint256 rentalPropertyId
    )
        public
        rentalPropertyListed(rentalPropertyId)
        landlordOnly(rentalPropertyId)
        rentalPropertyVacant(rentalPropertyId)
    {
        //PaymentEscrow Contract refund the protection fee (LeaseToken) to the landlord during unlisting of the rental property
        paymentEscrowContract.refund(
            rentalPropertyContract.getPaymentId(rentalPropertyId)
        );

        //Set the deposit required for the rental property to 0
        rentalPropertyDeposits[rentalPropertyId] = 0;
        //Remove the payment transaction id from the rental property
        rentalPropertyContract.setPaymentId(rentalPropertyId, 0);
        //Set the rental property as not listed
        rentalPropertyContract.setListedStatus(rentalPropertyId, false);
        //Decrement the number of listed rental properties
        rentalPropertyContract.decrementListedRentalProperty();
        emit RentalPropertyUnlisted(rentalPropertyId);
    }

    //Tenant can apply for a rental property by submitting a rental application.
    //Tenant must initially pay the deposit (LeaseToken) for the rental property to the PaymentEscrow contract.
    //Deposit will be returned to the tenant if the rental application is rejected.
    function applyRentalProperty(
        uint256 rentalPropertyId,
        string memory tenantName,
        string memory tenantEmail,
        string memory tenantPhone,
        string memory description
    )
        public
        rentalPropertyListed(rentalPropertyId)
        rentalPropertyNotFull(rentalPropertyId)
        tenantNotApplied(rentalPropertyId)
    {
        require(
            msg.sender != rentalPropertyContract.getLandlord(rentalPropertyId),
            "Landlord cannot apply for own rental property"
        );

        uint256 applicationId = rentalApplicationCounts[rentalPropertyId];
        rentalApplications[rentalPropertyId][applicationId] = RentalApplication(
            rentalPropertyId,
            rentalApplicationCounts[rentalPropertyId],
            msg.sender,
            tenantName,
            tenantEmail,
            tenantPhone,
            description,
            0,
            RentStatus.PENDING,
            new uint256[](1000) // Limit of 1000 payment transactions
        );

        // Deposit Fee (LeaseToken) required for the rental property
        uint256 depositFee = rentalPropertyDeposits[rentalPropertyId];
        // Create a payment transaction between tenant and PaymentEscrow contract
        uint256 paymentId = createPaymentTransaction(
            msg.sender, // Tenant
            rentalPropertyContract.getLandlord(rentalPropertyId), // Landlord
            depositFee // Deposit fee (LeaseToken) required for the rental property
        );
        
        // Add the payment transaction id to the rental application
        rentalApplications[rentalPropertyId][applicationId].paymentIds.push(
            paymentId
        );

        // Increment the application count
        rentalApplicationCounts[rentalPropertyId]++;
        // Tenant has applied for the rental property
        hasApplied[rentalPropertyId][msg.sender] = true;
        // Landlord cannot update/delete the rental property while there is an ongoing application
        rentalPropertyContract.setUpdateStatus(rentalPropertyId, false);
        emit RentalApplicationSubmitted(rentalPropertyId, applicationId);
    }

    // Landlord can reject a rental application.
    function rejectRentalApplication(
        uint256 rentalPropertyId,
        uint256 applicationId
    )
        public
        landlordOnly(rentalPropertyId)
        rentalApplicationExist(rentalPropertyId, applicationId)
        rentalApplicationPending(rentalPropertyId, applicationId)
    {
        // PaymentEscrow Contract refund the deposit (LeaseToken) to the tenant if the rental application is rejected (first payment transaction id)
        // First payment transaction id in the array is always the deposit
        paymentEscrowContract.refund(
            rentalApplications[rentalPropertyId][applicationId].paymentIds[0]
        );

        // Remove the rental application from the rental property and update corresponding mappings
        removeApplication(rentalPropertyId, applicationId);

        emit RentalApplicationRejected(rentalPropertyId, applicationId);
    }

    //Landlord can accept a rental application to start the rental process.
    function acceptRentalApplication(
        uint256 rentalPropertyId,
        uint256 applicationId
    )
        public
        landlordOnly(rentalPropertyId)
        rentalApplicationExist(rentalPropertyId, applicationId)
        rentalApplicationPending(rentalPropertyId, applicationId)
    {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        // Release the deposit (LeaseToken) to the landlord if the rental application is accepted (first payment transaction id)
        // First payment transaction id in the array is always the deposit
        paymentEscrowContract.release(rentalApplication.paymentIds[0]);

        // Update the rental application status to ongoing
        rentalApplication.status = RentStatus.ONGOING;
        emit RentalApplicationAccepted(rentalPropertyId, applicationId);
    }

    //Tenant can make a payment for the rental property.
    function makePayment(
        uint256 rentalPropertyId,
        uint256 applicationId
    )
        public
        rentalPropertyListed(rentalPropertyId)
        tenantApplied(rentalPropertyId)
        rentalApplicationExist(rentalPropertyId, applicationId)
        rentalApplicationOngoing(rentalPropertyId, applicationId)
    {
        require(
            msg.sender != rentalPropertyContract.getLandlord(rentalPropertyId),
            "Landlord cannot make payment for own rental property"
        );
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        // Monthly rent required for the rental property
        uint256 monthlyRent = rentalPropertyContract.getRentalPrice(
            rentalPropertyId
        );
        // Create a payment transaction between tenant and landlord
        uint256 paymentId = createPaymentTransaction(
            msg.sender, // Tenant
            rentalPropertyContract.getLandlord(rentalPropertyId), // Landlord
            monthlyRent // Monthly rent required for the rental property
        );

         // Add the payment transaction id to the rental application
        rentalApplications[rentalPropertyId][applicationId].paymentIds.push(
            paymentId
        );

        // Update the rental application status to made payment
        rentalApplication.status = RentStatus.MADE_PAYMENT;
        emit PaymentMade(rentalPropertyId, applicationId);
    }

    //Landlord can accept a payment from a tenant.
    function acceptPayment(
        uint256 rentalPropertyId,
        uint256 applicationId
    )
        public
        rentalPropertyListed(rentalPropertyId)
        landlordOnly(rentalPropertyId)
        rentalApplicationExist(rentalPropertyId, applicationId)
        rentalApplicationMadePayment(rentalPropertyId, applicationId)
    {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        // Release the monthly rent to the landlord if the payment is accepted (latest payment transaction id)
        // First payment transaction id in the array is always the deposit so the latest payment transaction id is the most recent monthly rent made by the tenant
        paymentEscrowContract.release(
            rentalApplication.paymentIds[
                rentalApplication.paymentIds.length - 1
            ]
        );

        // Increment the number of months the tenant has paid
        rentalApplication.monthsPaid++;

        // Check if the rental is completed for the tenant (e.g. tenant move out and landlord return deposit if any), else the rental is ongoing
        if (
            rentalApplication.monthsPaid ==
            rentalPropertyContract.getLeaseDuration(rentalPropertyId)
        ) {
            rentalApplication.status = RentStatus.COMPLETED;
        } else {
            rentalApplication.status = RentStatus.ONGOING;
        }

        emit PaymentAccepted(rentalPropertyId, applicationId);
    }

    //Tenant move out of the rental property and landlord return deposit if any.
    function moveOut(
        uint256 rentalPropertyId,
        uint256 applicationId
    )
        public
        rentalPropertyListed(rentalPropertyId)
        tenantApplied(rentalPropertyId)
        rentalApplicationExist(rentalPropertyId, applicationId)
        rentalApplicationCompleted(rentalPropertyId, applicationId)
    {
        require(
            msg.sender != rentalPropertyContract.getLandlord(rentalPropertyId),
            "Landlord cannot move out of own rental property"
        );

        // PaymentEscrow Contract refund the deposit fee balance (LeaseToken) to the tenant if the rental is completed
        uint256 depositFee = rentalPropertyDeposits[rentalPropertyId];
        // Create a payment transaction between tenant and landlord
        uint256 paymentId = createPaymentTransaction(
            rentalPropertyContract.getLandlord(rentalPropertyId), // Landlord
            msg.sender, // Tenant
            depositFee // Deposit fee balance (LeaseToken) to be returned to the tenant if the rental is completed
        );
        // Release the remaining deposit fee balance (LeaseToken) from PaymentEscrow to the tenant if the rental is completed
        paymentEscrowContract.release(paymentId);

        // Add the payment transaction id to the rental application
        rentalApplications[rentalPropertyId][applicationId].paymentIds.push(
            paymentId
        );

        // Remove the rental application from the rental property and update corresponding mappings
        removeApplication(rentalPropertyId, applicationId);

        emit tenantMoveOut(rentalPropertyId, applicationId);
    }


    // ################################################### INTERNAL FUNCTIONS ################################################### //
    
    // Remove the rental application from the rental property and update corresponding mappings
    function removeApplication(
        uint256 rentalPropertyId,
        uint256 applicationId
    )
        private
        rentalPropertyListed(rentalPropertyId)
        rentalApplicationExist(rentalPropertyId, applicationId)
    {
        // Application count is reduced by 1
        rentalApplicationCounts[rentalPropertyId]--;
        // Tenant can reapply for the rental property
        hasApplied[rentalPropertyId][
            rentalApplications[rentalPropertyId][applicationId].tenantAddress
        ] = false;
        // Remove the rental application
        delete rentalApplications[rentalPropertyId][applicationId];

        if (rentalApplicationCounts[rentalPropertyId] == 0) {
            // Landlord can re-update the rental property if there is no ongoing application
            rentalPropertyContract.setUpdateStatus(rentalPropertyId, true);
        }
    }

    // Create a payment transaction between two parties
    function createPaymentTransaction(
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
        return paymentId;
    }

    // ################################################### GETTER METHODS ################################################### //

    //Get the rental application details for a rental property.
    function getRentalApplication(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) public view returns (RentalApplication memory) {
        return rentalApplications[rentalPropertyId][applicationId];
    }

    //Get all rental applications for a rental property.
    function getRentalApplicationsFromRentalProperty(
        uint256 rentalPropertyId
    )
        public
        view
        landlordOnly(rentalPropertyId)
        returns (RentalApplication[] memory)
    {
        RentalApplication[] memory applications = new RentalApplication[](
            rentalApplicationCounts[rentalPropertyId]
        );
        for (
            uint256 i = 0;
            i < rentalApplicationCounts[rentalPropertyId];
            i++
        ) {
            applications[i] = rentalApplications[rentalPropertyId][i];
        }
        return applications;
    }

    //Get the number of rental applications for a rental property.
    function getRentalApplicationCount(
        uint256 rentalPropertyId
    ) public view returns (uint256) {
        return rentalApplicationCounts[rentalPropertyId];
    }

    //Check if a tenant has applied for a rental property.
    function getHasApplied(
        uint256 rentalPropertyId,
        address tenantAddress
    ) public view returns (bool) {
        return hasApplied[rentalPropertyId][tenantAddress];
    }

    //Get count of rental applications for a tenant.
    function getRentalApplicationCountByTenant(
        address tenantAddress
    ) public view returns (uint256) {
        uint256 count = 0;
        for (
            uint256 i = 0;
            i < rentalPropertyContract.getNumRentalProperty();
            i++
        ) {
            if (hasApplied[i][tenantAddress]) {
                count++;
            }
        }
        return count;
    }

    //Get all rental properties that a tenant has applied for.
    function getRentalPropertiesAppliedByTenant(
        address tenantAddress
    ) public view returns (RentalApplication[] memory) {
        uint256 count = getRentalApplicationCountByTenant(tenantAddress);

        RentalApplication[] memory applications = new RentalApplication[](
            count
        );
        uint256 index = 0;
        for (
            uint256 i = 0;
            i < rentalPropertyContract.getNumRentalProperty();
            i++
        ) {
            if (hasApplied[i][tenantAddress]) {
                applications[index] = rentalApplications[i][i];
                index++;
            }
        }
        return applications;
    }

    //Get the deposit required for a rental property.
    function getDepositAmount(
        uint256 rentalPropertyId
    ) public view returns (uint256) {
        return rentalPropertyDeposits[rentalPropertyId];
    }
}