pragma solidity ^0.5.0;

import "./ERC20.sol";

contract LeaseToken {
    ERC20 erc20Contract;
    uint256 supplyLimit;
    uint256 currentSupply;
    address owner;
    
    constructor() public {
        ERC20 e = new ERC20();
        erc20Contract = e;
        owner = msg.sender;
        supplyLimit = 1e18; // 1e18 LeaseToken supply limit
    }

    event getCredit(uint256 credit);
    event creditChecked(uint256 credit);
    event transferCredit(address recipient, uint256 credit);
    event transferCreditFrom(address sender, address recipient, uint256 credit);
    event approveCredit(address spender, uint256 credit);


    function getLeaseToken() public payable {
        uint256 leaseToken = msg.value / 1e16; // Get LeaseToken eligible (1e16 wei = 1 LeaseToken OR 0.01 ETH = 1 LeaseToken)
        require(erc20Contract.totalSupply() + leaseToken < supplyLimit, "LeaseToken supply is not enough");
        emit getCredit(leaseToken);
        erc20Contract.mint(msg.sender, leaseToken);
        
    }

    function checkLeaseToken() public returns(uint256) {
        uint256 leaseToken = erc20Contract.balanceOf(msg.sender);
        emit creditChecked(leaseToken);
        return leaseToken;
    }

    function transferLeaseToken(address recipient, uint256 leaseToken) public {
        erc20Contract.transfer(recipient, leaseToken);
        emit transferCredit(recipient, leaseToken);
    }

    function transferLeaseTokenFrom(address sender, address recipient, uint256 leaseToken) public {
        erc20Contract.transferFrom(sender, recipient, leaseToken);
        emit transferCreditFrom(sender, recipient, leaseToken);
    }

    function approveLeaseToken(address spender, uint256 leaseToken) public {
        erc20Contract.approve(spender, leaseToken);
        emit approveCredit(spender, leaseToken);
    }

}