// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";

contract LeaseToken {
    ERC20 erc20Contract;
    uint256 supplyLimit;
    uint256 currentSupply;
    address owner;

    constructor() {
        ERC20 e = new ERC20();
        erc20Contract = e;
        owner = msg.sender;
        supplyLimit = 1e18; // 1e18 LeaseToken supply limit
    }

    event getCredit(uint256 credit);
    event transferCredit(address sender, address recipient, uint256 credit);
    event transferCreditFrom(
        address spender,
        address sender,
        address recipient,
        uint256 credit
    );
    event approveCredit(address sender, address spender, uint256 credit);

    function getLeaseToken() public payable {
        uint256 leaseToken = msg.value / 1e16; // Get LeaseToken eligible (1e16 wei = 1 LeaseToken OR 0.01 ETH = 1 LeaseToken)
        require(
            erc20Contract.totalSupply() + leaseToken < supplyLimit,
            "LeaseToken supply is not enough"
        );
        emit getCredit(leaseToken);
        erc20Contract.mint(msg.sender, leaseToken);
    }

    function checkLeaseToken(address recipient) public view returns (uint256) {
        uint256 leaseToken = erc20Contract.balanceOf(recipient);
        return leaseToken;
    }

    function transferLeaseToken(
        address sender,
        address recipient,
        uint256 leaseToken
    ) public {
        erc20Contract.transferLT(sender, recipient, leaseToken);
        emit transferCredit(sender, recipient, leaseToken);
    }

    function transferLeaseTokenFrom(
        address spender,
        address sender,
        address recipient,
        uint256 leaseToken
    ) public {
        erc20Contract.transferFromLT(spender, sender, recipient, leaseToken);
        emit transferCreditFrom(spender, sender, recipient, leaseToken);
    }

    function approveLeaseToken(
        address sender,
        address spender,
        uint256 leaseToken
    ) public {
        erc20Contract.approveLT(sender, spender, leaseToken);
        emit approveCredit(sender, spender, leaseToken);
    }

    function checkLeaseTokenAllowance(
        address _owner,
        address spender
    ) public view returns (uint256) {
        uint256 allowance = erc20Contract.allowance(_owner, spender);
        return allowance;
    }

    function convertLeaseTokenToETH(
        address sender,
        uint256 leaseTokenAmount
    ) public {
        require(leaseTokenAmount > 0, "Invalid amount");
        require(
            erc20Contract.balanceOf(sender) >= leaseTokenAmount,
            "Insufficient balance"
        );

        uint256 ethAmount = leaseTokenAmount * 1e16; // 1 LeaseToken = 0.01 ETH (1e16 wei = 1 LeaseToken)
        require(
            address(this).balance >= ethAmount,
            "Contract does not have enough Ether to send"
        );

        erc20Contract.burn(sender, leaseTokenAmount);
        payable(sender).transfer(ethAmount);
    }
}
