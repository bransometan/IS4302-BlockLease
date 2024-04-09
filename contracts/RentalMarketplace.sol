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
        address tenantAddress; // The tenant
        string tenantName; // The tenant name
        string tenantEmail; // The tenant email
        string tenantPhone; // The tenant contact
        string description; // The tenant description of why they want to rent the property
        uint256 monthsPaid; // The number of months the tenant has paid
        RentStatus status; // The status of the rental application
        uint256[] paymentIds; // All the payment transaction ids by this tenant for the rental property
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

    event RentalPropertyAdded(
        uint256 rentalPropertyId,
        uint256 depositLeaseToken
    );
    event RentalPropertyRemoved(uint256 rentalPropertyId);
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

    // Modifier to check the rental property is full
    modifier rentalPropertyFull(uint256 rentalPropertyId) {
        require(
            rentalApplicationCounts[rentalPropertyId] ==
                rentalPropertyContract.getNumOfTenants(rentalPropertyId),
            "Rental property is not full"
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
    modifier depositLeaseTokenGreaterThanZero(uint256 depositLeaseToken) {
        require(
            depositLeaseToken > 0,
            "Deposit LeaseToken must be greater than 0"
        );
        _;
    }

    // ################################################### FUNCTIONS ################################################### //

    //Landlord can list a rental property to the marketplace to start accepting tenants.
    function listARentalProperty(
        uint256 rentalPropertyId,
        uint256 depositLeaseToken
    )
        public
        rentalPropertyNotListed(rentalPropertyId)
        depositLeaseTokenGreaterThanZero(depositLeaseToken)
        landlordOnly(rentalPropertyId)
    {   
        //Set the deposit required for the rental property
        rentalPropertyDeposits[rentalPropertyId] = depositLeaseToken;
        //Set the rental property as listed
        rentalPropertyContract.setListedStatus(rentalPropertyId, true);
        //Increment the number of listed rental properties
        rentalPropertyContract.incrementListedRentalProperty();
        emit RentalPropertyAdded(rentalPropertyId, depositLeaseToken);
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
        //Set the deposit required for the rental property to 0
        rentalPropertyDeposits[rentalPropertyId] = 0;
        //Set the rental property as not listed
        rentalPropertyContract.setListedStatus(rentalPropertyId, false);
        //Decrement the number of listed rental properties
        rentalPropertyContract.decrementListedRentalProperty();
        emit RentalPropertyRemoved(rentalPropertyId);
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
        require(msg.sender != rentalPropertyContract.getLandlord(rentalPropertyId), "Landlord cannot apply for own rental property");

        uint256 applicationId = rentalApplicationCounts[rentalPropertyId];
        rentalApplications[rentalPropertyId][applicationId] = RentalApplication(
            msg.sender,
            tenantName,
            tenantEmail,
            tenantPhone,
            description,
            0,
            RentStatus.PENDING,
            new uint256[](1000) // Limit of 1000 payment transactions
        );
        rentalApplicationCounts[rentalPropertyId]++;
        hasApplied[rentalPropertyId][msg.sender] = true;

        // Deposit LeaseToken required for the rental property
        uint256 depositLeaseToken = rentalPropertyDeposits[rentalPropertyId];
        // Create a payment transaction for the tenant
        uint256 paymentId = paymentEscrowContract.createPayment(
            msg.sender,
            rentalPropertyContract.getLandlord(rentalPropertyId),
            depositLeaseToken
        );
        // Add the payment transaction id to the rental application
        rentalApplications[rentalPropertyId][applicationId].paymentIds.push(
            paymentId
        );
        // Tenant pay/transfer the deposit (LeaseToken) for the rental property to the PaymentEscrow contract
        paymentEscrowContract.pay(paymentId);

        // Landlord cannot update the rental property while there is an ongoing application
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
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        // Refund the deposit (LeaseToken) to the tenant if the rental application is rejected (latest payment transaction id)
        paymentEscrowContract.refund(
            rentalApplication.paymentIds[
                rentalApplication.paymentIds.length - 1
            ]
        );

        // Application count is reduced by 1
        rentalApplicationCounts[rentalPropertyId]--;
        // Tenant can reapply for the rental property
        hasApplied[rentalPropertyId][rentalApplication.tenantAddress] = false;
        // Remove the rental application
        delete rentalApplications[rentalPropertyId][applicationId];

        if (rentalApplicationCounts[rentalPropertyId] == 0) {
            // Landlord can re-update the rental property if there is no ongoing application
            rentalPropertyContract.setUpdateStatus(rentalPropertyId, true);
        }
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

        // Release the deposit (LeaseToken) to the landlord if the rental application is accepted (latest payment transaction id)
        paymentEscrowContract.release(
            rentalApplication.paymentIds[
                rentalApplication.paymentIds.length - 1
            ]
        );

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
        require(msg.sender != rentalPropertyContract.getLandlord(rentalPropertyId), "Landlord cannot apply for own rental property");
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        // Monthly rent required for the rental property
        uint256 monthlyRent = rentalPropertyContract.getRentalPrice(
            rentalPropertyId
        );
        // Create a payment transaction for the tenant
        uint256 paymentId = paymentEscrowContract.createPayment(
            msg.sender,
            rentalPropertyContract.getLandlord(rentalPropertyId),
            monthlyRent
        );
        // Add the payment transaction id to the rental application
        rentalApplications[rentalPropertyId][applicationId].paymentIds.push(
            paymentId
        );
        // Tenant pay/transfer the monthly rent for the rental property to the PaymentEscrow contract
        paymentEscrowContract.pay(paymentId);

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
        paymentEscrowContract.release(
            rentalApplication.paymentIds[
                rentalApplication.paymentIds.length - 1
            ]
        );

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

    //Get the deposit required for a rental property.
    function getDepositAmount(
        uint256 rentalPropertyId
    ) public view returns (uint256) {
        return rentalPropertyDeposits[rentalPropertyId];
    }

    //Get the address of the RentalProperty contract.
    function getRentalPropertyContractAddress() public view returns (address) {
        return address(rentalPropertyContract);
    }

    //Get the address of the PaymentEscrow contract.
    function getPaymentEscrowContractAddress() public view returns (address) {
        return address(paymentEscrowContract);
    }
    
}
