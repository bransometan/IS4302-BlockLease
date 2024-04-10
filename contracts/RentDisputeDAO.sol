// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RentDisputeDAO {
    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //
    
    struct RentDispute {
        uint256 id;
        address tenant;
        address landlord;
        uint256 startDate;
        uint256 endDate;
        uint256 disputeAmount;
        string disputeReason;
        bool isResolved;
    }

    uint256 private numOfDisputes = 0;
    mapping(uint256 => RentDispute) private disputes; // disputeId => RentDispute
    mapping(address => uint256[]) private tenantDisputes; // tenant => disputeId[]
    mapping(address => uint256[]) private landlordDisputes; // landlord => disputeId[]

    

    
    
    // ################################################### EVENTS ################################################### //
    
    
    
    
    // ################################################### MODIFIERS ################################################### //
    
    
    
    
    // ################################################### FUNCTIONS ################################################### //
    
    
    
    
    // ################################################### SETTER METHODS ################################################### //
    
    
    
    // ################################################### GETTER METHODS ################################################### //
}
