// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract RentalProperty {
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //

    enum PropertyType {
        HDB,
        Condo,
        Landed,
        Other
    }

    struct rentalProperty {
        string location;
        string postalCode;
        string unitNumber;
        PropertyType propertyType;
        string description;
        uint256 numOfTenants; // number of tenants in the property
        uint256 rentalPrice; // rental price in LeaseToken
        uint256 leaseDuration; // lease duration in months
        address landlord; // address of the landlord owner
    }

    uint256 public numRentalProperty = 0;
    mapping(uint256 => rentalProperty) public rentalProperties; // map of rental properties indexed by propertyId

    // ################################################### EVENTS ################################################### //

    event RentalPropertyCreated(
        uint256 rentalPropertyId,
        string location,
        string postalCode,
        string unitNumber,
        PropertyType propertyType,
        string description,
        uint256 numOfTenants,
        uint256 rentalPrice,
        uint256 leaseDuration,
        address landlord
    );

    event RentalPropertyUpdateLocation(
        uint256 rentalPropertyId,
        string newLocation
    );

    event RentalPropertyUpdatePostalCode(
        uint256 rentalPropertyId,
        string newPostalCode
    );

    event RentalPropertyUpdateUnitNumber(
        uint256 rentalPropertyId,
        string newUnitNumber
    );

    event RentalPropertyUpdatePropertyType(
        uint256 rentalPropertyId,
        PropertyType newPropertyType
    );

    event RentalPropertyUpdateDescription(
        uint256 rentalPropertyId,
        string newDescription
    );

    event RentalPropertyUpdateNumOfTenants(
        uint256 rentalPropertyId,
        uint256 newNumOfTenants
    );

    event RentalPropertyUpdateRentalPrice(
        uint256 rentalPropertyId,
        uint256 newRentalPrice
    );

    event RentalPropertyUpdateLeaseDuration(
        uint256 rentalPropertyId,
        uint256 newLeaseDuration
    );

    event RentalPropertyDeleted(uint256 rentalPropertyId);

    // ################################################### MODIFIERS ################################################### //

    //Modifier to ensure a function is callable only by its landlord owner
    modifier ownerOnly(uint256 rentalPropertyId) {
        require(
            rentalProperties[rentalPropertyId].landlord == msg.sender,
            "Only the landlord can call this function"
        );
        _;
    }

    //Modifier to ensure a function is accessible only if the rental property id is valid
    modifier validRentalPropertyId(uint256 rentalPropertyId) {
        require(
            rentalPropertyId < numRentalProperty,
            "Invalid rental property id"
        );
        _;
    }

    modifier validNumOfTenants(uint256 numOfTenants) {
        require(numOfTenants > 0, "Number of tenants must be greater than 0");
        _;
    }

    modifier validRentalPrice(uint256 rentalPrice) {
        require(rentalPrice > 0, "Rental Price must be greater than 0");
        _;
    }

    modifier validLeaseDuration(uint256 leaseDuration) {
        require(leaseDuration > 0, "Lease Duration must be greater than 0");
        _;
    }

    // ################################################### CREATE METHOD ################################################### //

    // Function for landlord to create a new Rental Property, and add to 'rentalProperties' map. requires at least 0.01ETH to create
    function addRentalProperty(
        string memory _location,
        string memory _postalCode,
        string memory _unitNumber,
        PropertyType _propertyType,
        string memory _description,
        uint256 _numOfTenants,
        uint256 _rentalPrice,
        uint256 _leaseDuration
    )
        public
        validNumOfTenants(_numOfTenants)
        validRentalPrice(_rentalPrice)
        validLeaseDuration(_leaseDuration)
        returns (uint256)
    {
        // New Rental Property object
        rentalProperty memory newRentalProperty = rentalProperty(
            _location,
            _postalCode,
            _unitNumber,
            _propertyType,
            _description,
            _numOfTenants,
            _rentalPrice,
            _leaseDuration,
            msg.sender // landlord is the sender
        );

        uint256 newRentalPropertyId = numRentalProperty++; // increment rental property id
        rentalProperties[newRentalPropertyId] = newRentalProperty; // add to rentalProperties map
        emit RentalPropertyCreated(
            newRentalPropertyId,
            _location,
            _postalCode,
            _unitNumber,
            _propertyType,
            _description,
            _numOfTenants,
            _rentalPrice,
            _leaseDuration,
            msg.sender
        );

        return newRentalPropertyId; //return new rental property id
    }

    // ################################################### GETTER METHODS ################################################### //

    //Function to get the location of a rental property
    function getLocation(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].location;
    }

    //Function to get the postal code of a rental property
    function getPostalCode(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].postalCode;
    }

    //Function to get the unit number of a rental property
    function getUnitNumber(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].unitNumber;
    }

    //Function to get the property type of a rental property
    function getPropertyType(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (PropertyType)
    {
        return rentalProperties[rentalPropertyId].propertyType;
    }

    //Function to get the description of a rental property
    function getDescription(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (string memory)
    {
        return rentalProperties[rentalPropertyId].description;
    }

    //Function to get the number of tenants in a rental property
    function getNumOfTenants(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].numOfTenants;
    }

    //Function to get the rental price of a rental property
    function getRentalPrice(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].rentalPrice;
    }

    //Function to get the lease duration of a rental property
    function getLeaseDuration(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (uint256) {
        return rentalProperties[rentalPropertyId].leaseDuration;
    }

    //Function to get the landlord of a rental property
    function getLandlord(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (address) {
        return rentalProperties[rentalPropertyId].landlord;
    }

    // ################################################### SETTER METHODS ################################################### //

    //Function to update the location of a rental property
    function updateLocation(
        uint256 rentalPropertyId,
        string memory newLocation
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
    {
        rentalProperties[rentalPropertyId].location = newLocation;
        emit RentalPropertyUpdateLocation(rentalPropertyId, newLocation);
    }

    //Function to update the postal code of a rental property
    function updatePostalCode(
        uint256 rentalPropertyId,
        string memory newPostalCode
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
    {
        rentalProperties[rentalPropertyId].postalCode = newPostalCode;
        emit RentalPropertyUpdatePostalCode(rentalPropertyId, newPostalCode);
    }

    //Function to update the unit number of a rental property
    function updateUnitNumber(
        uint256 rentalPropertyId,
        string memory newUnitNumber
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
    {
        rentalProperties[rentalPropertyId].unitNumber = newUnitNumber;
        emit RentalPropertyUpdateUnitNumber(rentalPropertyId, newUnitNumber);
    }

    //Function to update the property type of a rental property
    function updatePropertyType(
        uint256 rentalPropertyId,
        PropertyType newPropertyType
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
    {
        rentalProperties[rentalPropertyId].propertyType = newPropertyType;
        emit RentalPropertyUpdatePropertyType(
            rentalPropertyId,
            newPropertyType
        );
    }

    //Function to update the description of a rental property
    function updateDescription(
        uint256 rentalPropertyId,
        string memory newDescription
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
    {
        rentalProperties[rentalPropertyId].description = newDescription;
        emit RentalPropertyUpdateDescription(rentalPropertyId, newDescription);
    }

    //Function to update the number of tenants in a rental property
    function updateNumOfTenants(
        uint256 rentalPropertyId,
        uint256 newNumOfTenants
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validNumOfTenants(newNumOfTenants)
    {
        rentalProperties[rentalPropertyId].numOfTenants = newNumOfTenants;
        emit RentalPropertyUpdateNumOfTenants(
            rentalPropertyId,
            newNumOfTenants
        );
    }

    //Function to update the rental price of a rental property
    function updateRentalPrice(
        uint256 rentalPropertyId,
        uint256 newRentalPrice
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validRentalPrice(newRentalPrice)
    {
        rentalProperties[rentalPropertyId].rentalPrice = newRentalPrice;
        emit RentalPropertyUpdateRentalPrice(rentalPropertyId, newRentalPrice);
    }

    //Function to update the lease duration of a rental property
    function updateLeaseDuration(
        uint256 rentalPropertyId,
        uint256 newLeaseDuration
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validLeaseDuration(newLeaseDuration)
    {
        rentalProperties[rentalPropertyId].leaseDuration = newLeaseDuration;
        emit RentalPropertyUpdateLeaseDuration(
            rentalPropertyId,
            newLeaseDuration
        );
    }

    // ################################################### DELETE METHOD ################################################### //

    //Function to delete a rental property
    function deleteRentalProperty(
        uint256 rentalPropertyId
    )
        public
        ownerOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
    {
        delete rentalProperties[rentalPropertyId];
        emit RentalPropertyDeleted(rentalPropertyId);
    }
}
