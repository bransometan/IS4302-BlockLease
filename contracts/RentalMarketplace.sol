// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RentalProperty.sol";
import "./PaymentEscrow.sol";

contract RentalMarketplace {
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
    uint256 public safeguardLeaseToken;
    uint256 private numOfRentalProperty = 0;

    // This is mapping of RentalProperty id to the downpayment/deposit of the property
    mapping(uint256 => uint256) listRentalProperty;
    // This is mapping of RentalProperty id to the (RentalApplication id to RentalApplication struct) mapping
    mapping(uint256 => mapping(uint256 => RentalApplication))
        public rentalApplications;
    // This is to keep track of the number of applications for a rental property (RentalProperty id to number of applications mapping)
    mapping(uint256 => uint256) private rentalApplicationCounts;
    // This is to keep track if a tenant has already applied for a rental property
    mapping(uint256 => mapping(address => bool)) private hasApplied;

    constructor(
        address rentalPropertyAddress,
        address paymentEscrowAddress,
        uint256 _safeguardLeaseToken
    ) public {
        rentalPropertyContract = RentalProperty(rentalPropertyAddress);
        paymentEscrowContract = PaymentEscrow(paymentEscrowAddress);
        safeguardLeaseToken = _safeguardLeaseToken;
    }

    //Landlord can add a rental property to the marketplace to start accepting tenants.
    function addRentalProperty(
        uint256 rentalPropertyId,
        uint256 depositLeaseToken
    ) public {
        require(
            depositLeaseToken > 0,
            "Deposit LeaseToken must be greater than 0"
        );
        require(
            msg.sender == rentalPropertyContract.getLandlord(rentalPropertyId), "Only landlord can add rental property"
        );
        listRentalProperty[rentalPropertyId] = depositLeaseToken;
        numOfRentalProperty++;
    }

    //Landlord can remove a rental property from the marketplace to stop accepting tenants.
    function removeRentalProperty(uint256 rentalPropertyId) public {
        require(
            msg.sender == rentalPropertyContract.getLandlord(rentalPropertyId), "Only landlord can remove rental property"
        );
        listRentalProperty[rentalPropertyId] = 0;
        numOfRentalProperty--;
    }

    //Tenant can apply for a rental property by submitting a rental application.
    function applyRentalProperty(
        uint256 rentalPropertyId,
        string memory tenantName,
        string memory tenantEmail,
        string memory tenantPhone,
        string memory description
    ) public {
        require(
            listRentalProperty[rentalPropertyId] > 0,
            "Rental property does not exist"
        );
        require(
            !hasApplied[rentalPropertyId][msg.sender],
            "Tenant has already applied for this rental property"
        );
        require(
            rentalPropertyContract.getLandlord(rentalPropertyId) != msg.sender,
            "Landlord cannot apply for own rental property"
        );
        require(
            rentalApplicationCounts[rentalPropertyId] <
                rentalPropertyContract.getNumOfTenants(rentalPropertyId),
            "Rental property is full"
        );

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
    }

    //Landlord can view all rental applications for a rental property.
    function viewRentalApplications(
        uint256 rentalPropertyId
    ) public view returns (RentalApplication[] memory) {
        require(
            msg.sender == rentalPropertyContract.getLandlord(rentalPropertyId), "Only landlord can view rental applications"
        );
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

    //Landlord can accept a rental application to start the rental process.
    function acceptRentalApplication(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) public {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        require(
            msg.sender == rentalPropertyContract.getLandlord(rentalPropertyId), "Only landlord can accept rental application"
        );
        require(
            rentalApplication.status == RentStatus.PENDING,
            "Rental application is not pending"
        );

        uint256 depositLeaseToken = listRentalProperty[rentalPropertyId];

        // uint256 paymentId = paymentEscrowContract.initiateApplicationPayment(
        //     rentalPropertyContract.getLandlord(rentalPropertyId),
        //     rentalApplication.tenantId,
        //     rentalPropertyId,
        //     depositLeaseToken,
        //     safeguardLeaseToken
        // );

        rentalApplication.status = RentStatus.ONGOING;
    }

    //Tenant can make a payment for the rental property.
    function makePayment(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) public payable {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        require(
            listRentalProperty[rentalPropertyId] > 0,
            "Rental property does not exist"
        );
        require(
            hasApplied[rentalPropertyId][msg.sender],
            "Tenant has not applied for this rental property"
        );
        require(
            rentalApplication.status == RentStatus.ONGOING,
            "Rental application is not ongoing"
        );

        uint256 monthlyRent = rentalPropertyContract.getMonthlyRent(
            rentalPropertyId
        );

        // uint256 paymentId = paymentEscrowContract.initiateRentPayment(
        //     rentalPropertyContract.getLandlord(rentalPropertyId),
        //     rentalApplication.tenantId,
        //     rentalPropertyId,
        //     monthlyRent
        // );

        rentalApplication.status = RentStatus.MADE_PAYMENT;
    }

    //Landlord can accept a payment from a tenant.
    function acceptPayment(
        uint256 rentalPropertyId,
        uint256 applicationId
    ) public {
        RentalApplication storage rentalApplication = rentalApplications[
            rentalPropertyId
        ][applicationId];

        require(
            msg.sender == rentalPropertyContract.getLandlord(rentalPropertyId), "Only landlord can accept payment"
        );
        require(
            rentalApplication.status == RentStatus.MADE_PAYMENT,
            "Tenant has not made payment"
        );

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
    }
}
