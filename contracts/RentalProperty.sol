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
        string location; // location of the property
        string postalCode; // postal code of the property
        string unitNumber; // unit number of the property
        PropertyType propertyType; // type of property
        string description; // description of the property
        uint256 numOfTenants; // number of tenants in the property
        uint256 rentalPrice; // rental price in LeaseToken
        uint256 leaseDuration; // lease duration in months
        address landlord; // address of the landlord owner
        bool updateStatus; // status of the rental property (true if property can be updated/deleted, false if property cannot be updated/deleted)
        bool isListed; // status of the rental property (true if property is listed, false if property is not listed)
    }

    uint256 private numRentalProperty = 0;
    uint256 private numListedRentalProperty = 0;
    mapping(uint256 => rentalProperty) private rentalProperties; // map of rental properties indexed by rentalPropertyId
    mapping(address => rentalProperty[]) private landlordRentalProperties; // map of rental properties indexed by landlord address

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
        address landlord,
        bool updateStatus,
        bool isListed
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
    modifier landlordOnly(uint256 rentalPropertyId) {
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

    modifier validUpdateStatus(uint256 rentalPropertyId) {
        require(
            rentalProperties[rentalPropertyId].updateStatus == true,
            "Rental Property cannot be updated"
        );
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
            msg.sender, // landlord is the sender
            true, // initially, rental property can be updated/deleted when there are no tenants applications
            false // initially, rental property is not listed
        );

        uint256 newRentalPropertyId = numRentalProperty++; // increment rental property id
        rentalProperties[newRentalPropertyId] = newRentalProperty; // add to rentalProperties map
        landlordRentalProperties[msg.sender].push(newRentalProperty); // add to landlordRentalProperties map

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
            msg.sender,
            true,
            false
        );

        return newRentalPropertyId; //return new rental property id
    }

    // ################################################### GETTER METHODS ################################################### //

    //Function to get a rental property
    function getRentalProperty(
        uint256 rentalPropertyId
    )
        public
        view
        validRentalPropertyId(rentalPropertyId)
        returns (rentalProperty memory)
    {
        return rentalProperties[rentalPropertyId];
    }

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

    //Function to get the number of rental properties
    function getNumRentalProperty() public view returns (uint256) {
        return numRentalProperty;
    }

    //Function to get the update status of a rental property
    function getUpdateStatus(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (bool) {
        return rentalProperties[rentalPropertyId].updateStatus;
    }

    //Function to get the listed status of a rental property
    function getListedStatus(
        uint256 rentalPropertyId
    ) public view validRentalPropertyId(rentalPropertyId) returns (bool) {
        return rentalProperties[rentalPropertyId].isListed;
    }

    //Function to get all the rental properties (listed and unlisted)
    function getAllRentalProperties()
        public
        view
        returns (rentalProperty[] memory)
    {
        rentalProperty[] memory allRentalProperties = new rentalProperty[](
            numRentalProperty
        );
        for (uint256 i = 0; i < numRentalProperty; i++) {
            allRentalProperties[i] = rentalProperties[i];
        }
        return allRentalProperties;
    }

    //Function to get all the listed rental properties
    function getAllListedRentalProperties()
        public
        view
        returns (rentalProperty[] memory)
    {
        rentalProperty[] memory listedRentalProperties = new rentalProperty[](
            numListedRentalProperty
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].isListed == true) {
                listedRentalProperties[index] = rentalProperties[i];
                index++;
            }
        }
        return listedRentalProperties;
    }

    //Function to get all the unlisted rental properties
    function getAllUnlistedRentalProperties()
        public
        view
        returns (rentalProperty[] memory)
    {
        rentalProperty[] memory unlistedRentalProperties = new rentalProperty[](
            numRentalProperty - numListedRentalProperty
        );
        uint256 index = 0;
        for (uint256 i = 0; i < numRentalProperty; i++) {
            if (rentalProperties[i].isListed == false) {
                unlistedRentalProperties[index] = rentalProperties[i];
                index++;
            }
        }
        return unlistedRentalProperties;
    }

    //Function to get all the rental properties of a landlord
    function getLandlordRentalProperties(
        address landlord
    ) public view returns (rentalProperty[] memory) {
        return landlordRentalProperties[landlord];
    }

    //Function to get all the listed rental properties of a landlord
    function getLandlordListedRentalProperties(
        address landlord
    ) public view returns (rentalProperty[] memory) {
        // get the number of listed rental properties of the landlord
        uint256 numLandlordListedRentalProperty = getNumLandlordListedRentalProperty(
                landlord
            );
        rentalProperty[] memory listedRentalProperties = new rentalProperty[](
            numLandlordListedRentalProperty
        );
        uint256 index = 0;
        for (
            uint256 i = 0;
            i < landlordRentalProperties[landlord].length;
            i++
        ) {
            if (landlordRentalProperties[landlord][i].isListed == true) {
                listedRentalProperties[index] = landlordRentalProperties[
                    landlord
                ][i];
                index++;
            }
        }
        return listedRentalProperties;
    }

    //Function to get all the unlisted rental properties of a landlord
    function getLandlordUnlistedRentalProperties(
        address landlord
    ) public view returns (rentalProperty[] memory) {
        rentalProperty[] memory unlistedRentalProperties = new rentalProperty[](
            landlordRentalProperties[landlord].length -
                getNumLandlordListedRentalProperty(landlord)
        );
        uint256 index = 0;
        for (
            uint256 i = 0;
            i < landlordRentalProperties[landlord].length;
            i++
        ) {
            if (landlordRentalProperties[landlord][i].isListed == false) {
                unlistedRentalProperties[index] = landlordRentalProperties[
                    landlord
                ][i];
                index++;
            }
        }
        return unlistedRentalProperties;
    }

    //Function to get the number of listed rental properties
    function getNumListedRentalProperty() public view returns (uint256) {
        return numListedRentalProperty;
    }

    //Function to get the number of listed rental properties of a landlord
    function getNumLandlordListedRentalProperty(
        address landlord
    ) public view returns (uint256) {
        uint256 numLandlordListedRentalProperty = 0;
        for (
            uint256 i = 0;
            i < landlordRentalProperties[landlord].length;
            i++
        ) {
            if (landlordRentalProperties[landlord][i].isListed == true) {
                numLandlordListedRentalProperty++;
            }
        }
        return numLandlordListedRentalProperty;
    }

    // ################################################### SETTER METHODS ################################################### //

    //Function to update the location of a rental property
    function updateLocation(
        uint256 rentalPropertyId,
        string memory newLocation
    )
        public
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validNumOfTenants(newNumOfTenants)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validRentalPrice(newRentalPrice)
        validUpdateStatus(rentalPropertyId)
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
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validLeaseDuration(newLeaseDuration)
        validUpdateStatus(rentalPropertyId)
    {
        rentalProperties[rentalPropertyId].leaseDuration = newLeaseDuration;
        emit RentalPropertyUpdateLeaseDuration(
            rentalPropertyId,
            newLeaseDuration
        );
    }

    //Function to set the new update status of a rental property
    //Not restricted to landlord as this function is used in RentalMarketplace to set the update status to false when there are tenants applications
    function setUpdateStatus(
        uint256 rentalPropertyId,
        bool newUpdateStatus
    ) public validRentalPropertyId(rentalPropertyId) {
        rentalProperties[rentalPropertyId].updateStatus = newUpdateStatus;
    }

    //Function to set the new listed status of a rental property
    //Not restricted to landlord as this function is used in RentalMarketplace to set the listed status to true when the rental property is listed
    function setListedStatus(
        uint256 rentalPropertyId,
        bool newListedStatus
    ) public validRentalPropertyId(rentalPropertyId) {
        rentalProperties[rentalPropertyId].isListed = newListedStatus;
    }

    //Function to increment the number of listed rental properties
    //Not restricted to landlord as this function is used in RentalMarketplace to increment the number of listed rental properties
    function incrementListedRentalProperty() public {
        numListedRentalProperty++;
    }

    //Function to decrement the number of listed rental properties
    //Not restricted to landlord as this function is used in RentalMarketplace to decrement the number of listed rental properties
    function decrementListedRentalProperty() public {
        numListedRentalProperty--;
    }

    // ################################################### DELETE METHOD ################################################### //

    //Function to delete a rental property
    function deleteRentalProperty(
        uint256 rentalPropertyId
    )
        public
        landlordOnly(rentalPropertyId)
        validRentalPropertyId(rentalPropertyId)
        validUpdateStatus(rentalPropertyId)
    {
        // delete rental property from rentalProperties map
        delete rentalProperties[rentalPropertyId];
        // delete rental property from landlordRentalProperties map
        landlordRentalProperties[msg.sender].pop();
        emit RentalPropertyDeleted(rentalPropertyId);
    }
}
