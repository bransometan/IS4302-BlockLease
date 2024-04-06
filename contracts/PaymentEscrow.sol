// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import "./LeaseToken.sol";

contract PaymentEscrow {

    // ################################################### STRUCTURE & STATE VARIABLES ################################################### //
    enum PaymentStatus {PENDING, PAID, RELEASED, REFUNDED}

    struct Payment {
        address payer;
        address payee;
        uint256 amount;
        PaymentStatus status;
    }

    // The number of payment transactions that have been made
    uint256 public numOfPayments = 0;
    // The number of tokens landlord must stake in the potential event of a dispute with tenant
    uint256 private protectionFee;
    // The commission fee (in tokens) that the platform charges for each transaction
    uint256 public commissionFee;

    LeaseToken leaseTokenContract;
   
    mapping(uint256 => Payment) public payments;

    address private owner;

    constructor(address _leaseTokenAddress, uint256 _protectionFee, uint256 _commissionFee) {
        leaseTokenContract = LeaseToken(_leaseTokenAddress);
        protectionFee = _protectionFee;
        commissionFee = _commissionFee;
        owner = msg.sender;
    }

    // ################################################### EVENTS ################################################### //

    event paymentCreated(address payer, address payee, uint256 amount);
    event paymentPaid(address payer, address payee, uint256 amount);
    event paymentReleased(address payer, address payee, uint256 amount);
    event paymentRefunded(address payer, address payee, uint256 amount);
    event protectionFeeSet(uint256 protectionFee);
    event commissionFeeSet(uint256 commissionFee);
    event tokenWithdrawn(address owner, uint256 amount);

    // ################################################### MODIFIERS ################################################### //

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyPayer(uint256 _paymentId) {
        require(msg.sender == payments[_paymentId].payer, "Only payer can call this function");
        _;
    }

    modifier onlyPayee(uint256 _paymentId) {
        require(msg.sender == payments[_paymentId].payee, "Only payee can call this function");
        _;
    }

    // ################################################### FUNCTIONS ################################################### //

    function createPayment(address _payer, address _payee, uint256 _amount) public onlyOwner {
        payments[numOfPayments] = Payment(_payer, _payee, _amount, PaymentStatus.PENDING);
        numOfPayments++;
        emit paymentCreated(_payer, _payee, _amount);
    }

    function pay(uint256 _paymentId) public {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.PENDING, "Payment has already been made");
        // Tenant transfers the payment amount to PaymentEscrow
        leaseTokenContract.transferLeaseTokenFrom(payment.payer, address(this), payment.amount);
        payment.status = PaymentStatus.PAID;
        emit paymentPaid(payment.payer, payment.payee, payment.amount);
    }

    function release(uint256 _paymentId) public {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.PAID, "Payment has not been made yet");
        // Landlord approves PaymentEscrow to transfer the payment amount to the tenant
        leaseTokenContract.approveLeaseToken(address(this), payment.amount);
        // PaymentEscrow transfers the payment amount to the tenant (minus the commission fee), commission fee is transferred to the platform
        leaseTokenContract.transferLeaseToken(payment.payee, payment.amount - commissionFee);
        payment.status = PaymentStatus.RELEASED;
        emit paymentReleased(payment.payer, payment.payee, payment.amount);
    }

    function refund(uint256 _paymentId) public {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.PAID, "Payment has not been made yet");
        // PaymentEscrow transfers the payment amount back to the landlord
        leaseTokenContract.transferLeaseToken(payment.payer, payment.amount);
        payment.status = PaymentStatus.REFUNDED;
        emit paymentRefunded(payment.payer, payment.payee, payment.amount);
    }

    function withdrawToken() public onlyOwner {
        leaseTokenContract.transferLeaseToken(owner, leaseTokenContract.checkLeaseToken((address(this))));
        emit tokenWithdrawn(owner, leaseTokenContract.checkLeaseToken((address(this))));
    }

    // ################################################### SETTER METHODS ################################################### //
    function setProtectionFee(uint256 _protectionFee) public onlyOwner {
        protectionFee = _protectionFee;
        emit protectionFeeSet(_protectionFee);
    }

    function setCommissionFee(uint256 _commissionFee) public onlyOwner {
        commissionFee = _commissionFee;
        emit commissionFeeSet(_commissionFee);
    } 

    // ################################################### GETTER METHODS ################################################### //

    // Function to get the protection fee
    function getProtectionFee() public view returns(uint256) {
        return protectionFee;
    }

    // Function to get the commission fee
    function getCommissionFee() public view returns(uint256) {
        return commissionFee;
    }

    // Function to get the payment details
    function getPayment(uint256 _paymentId) public view returns(Payment memory) {
        return payments[_paymentId];
    }

    // Function to get the number of payments
    function getNumOfPayments() public view returns(uint256) {
        return numOfPayments;
    }

    // Function to get the balance of the contract
    function getBalance() public returns(uint256) {
        return leaseTokenContract.checkLeaseToken(address(this));
    }

    // Function to get the owner of the contract
    function getOwner() public view returns(address) {
        return owner;
    }

    // Function to get the contract address
    function getContractAddress() public view returns(address) {
        return address(this);
    }


}