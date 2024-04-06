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
        RentStatus status;
    }

    RentalProperty rentalPropertyContract;
    PaymentEscrow paymentEscrowContract;

    // The number of tokens landlord must stake in the potential event of a dispute with tenant
    uint256 private safeguardLeaseToken;
    // The number of rental properties listed in the marketplace
    uint256 private numOfListedRentalProperty = 0;

    // This is mapping of RentalProperty id to the downpayment/deposit of the property
    mapping(uint256 => uint256) private listRentalProperty;
    // This is mapping of RentalProperty id to the (RentalApplication id to RentalApplication struct) mapping
    mapping(uint256 => mapping(uint256 => RentalApplication))
        private rentalApplications;
    // This is to keep track of the number of applications for a rental property (RentalProperty id to number of applications mapping)
    mapping(uint256 => uint256) private rentalApplicationCounts;
    // This is to keep track if a tenant has already applied for a rental property
    mapping(uint256 => mapping(address => bool)) private hasApplied;

    constructor(
        address rentalPropertyAddress,
        address paymentEscrowAddress,
        uint256 _safeguardLeaseToken
    ) {
        rentalPropertyContract = RentalProperty(rentalPropertyAddress);
        paymentEscrowContract = PaymentEscrow(paymentEscrowAddress);
        safeguardLeaseToken = _safeguardLeaseToken;
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

    // Modifier to check the tenant is not the owner of the rental property
    modifier tenantOnly(uint256 rentalPropertyId) {
        require(
            msg.sender != rentalPropertyContract.getLandlord(rentalPropertyId),
            "Tenant cannot perform this action"
        );
        _;
    }

    // Modifier to check the rental property is listed
    modifier rentalPropertyListed(uint256 rentalPropertyId) {
        require(
            listRentalProperty[rentalPropertyId] > 0,
            "Rental property is not listed"
        );
        _;
    }

    // Modifier to check the rental property is not listed
    modifier rentalPropertyNotListed(uint256 rentalPropertyId) {
        require(
            listRentalProperty[rentalPropertyId] == 0,
            "Rental property is already listed"
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
        listRentalProperty[rentalPropertyId] = depositLeaseToken;
        numOfListedRentalProperty++;
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
        listRentalProperty[rentalPropertyId] = 0;
        numOfListedRentalProperty--;
        emit RentalPropertyRemoved(rentalPropertyId);
    }

    //Tenant can view all listed rental properties (By Id) in the marketplace.
    function viewListedRentalPropertiesById()
        public
        view
        returns (uint256[] memory)
    {
        require(numOfListedRentalProperty > 0, "No rental property listed");
        uint256[] memory rentalProperties = new uint256[](
            numOfListedRentalProperty
        );
        uint256 index = 0;
        for (
            uint256 i = 0;
            i < rentalPropertyContract.getNumRentalProperty();
            i++
        ) {
            // Check if the rental property is listed
            if (listRentalProperty[i] > 0) {
                rentalProperties[index] = i;
                index++;
            }
        }
        return rentalProperties;
    }

    //Landlord can view all rental applications for a rental property.
    function viewRentalApplications(
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

    //Tenant can apply for a rental property by submitting a rental application.
    function applyRentalProperty(
        uint256 rentalPropertyId,
        string memory tenantName,
        string memory tenantEmail,
        string memory tenantPhone,
        string memory description
    )
        public
        tenantOnly(rentalPropertyId)
        rentalPropertyListed(rentalPropertyId)
        rentalPropertyNotFull(rentalPropertyId)
        tenantNotApplied(rentalPropertyId)
    {
        uint256 applicationId = rentalApplicationCounts[rentalPropertyId];
        rentalApplications[rentalPropertyId][applicationId] = RentalApplication(
            msg.sender,
            tenantName,
            tenantEmail,
            tenantPhone,
            description,
            0,
            RentStatus.PENDING
        );
        rentalApplicationCounts[rentalPropertyId]++;
        hasApplied[rentalPropertyId][msg.sender] = true;
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
        rentalApplicationPending(rentalPropertyId, applicationId)
    {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

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
        rentalApplicationPending(rentalPropertyId, applicationId)
    {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        uint256 depositLeaseToken = listRentalProperty[rentalPropertyId];

        // uint256 paymentId = paymentEscrowContract.initiateApplicationPayment(
        //     rentalPropertyContract.getLandlord(rentalPropertyId),
        //     rentalApplication.tenantId,
        //     rentalPropertyId,
        //     depositLeaseToken,
        //     safeguardLeaseToken
        // );

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
        tenantOnly(rentalPropertyId)
        tenantApplied(rentalPropertyId)
        rentalApplicationOngoing(rentalPropertyId, applicationId)
    {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        uint256 monthlyRent = rentalPropertyContract.getRentalPrice(
            rentalPropertyId
        );

        // uint256 paymentId = paymentEscrowContract.initiateRentPayment(
        //     rentalPropertyContract.getLandlord(rentalPropertyId),
        //     rentalApplication.tenantId,
        //     rentalPropertyId,
        //     monthlyRent
        // );

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
        rentalApplicationMadePayment(rentalPropertyId, applicationId)
    {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];
        // paymentEscrowContract.confirmRentPayment(
        //     rentalPropertyContract.getLandlord(rentalPropertyId),
        //     rentalApplication.tenantAddress,
        //     rentalPropertyId
        // );

        rentalApplication.monthsPaid++;

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

    //Get the number of listed rental properties in the marketplace.
    function getNumOfListedRentalProperty() public view returns (uint256) {
        return numOfListedRentalProperty;
    }

    //Get the rental application details for a rental property.
    function getRentalApplication(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) public view returns (RentalApplication memory) {
        return rentalApplications[rentalPropertyId][applicationId];
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
    function getListedRentalProperty(
        uint256 rentalPropertyId
    ) public view returns (uint256) {
        return listRentalProperty[rentalPropertyId];
    }

    //Get the address of the RentalProperty contract.
    function getRentalPropertyContractAddress() public view returns (address) {
        return address(rentalPropertyContract);
    }

    //Get the address of the PaymentEscrow contract.
    function getPaymentEscrowContractAddress() public view returns (address) {
        return address(paymentEscrowContract);
    }

    //Get the number of safeguardLeaseToken required for a rental property.
    function getSafeguardLeaseToken() public view returns (uint256) {
        return safeguardLeaseToken;
    }
}
