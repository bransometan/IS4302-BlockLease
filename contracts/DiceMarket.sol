pragma solidity ^0.5.0;
import "./Dice.sol";

contract DiceMarket {

    Dice diceContract;
    uint256 public comissionFee;
    address _owner = msg.sender;
    mapping(uint256 => uint256) listPrice;
     constructor(Dice diceAddress, uint256 fee) public {
        diceContract = diceAddress;
        comissionFee = fee;
    }
    
    event diceListed (uint256 id, uint256 price);
    event diceUnlisted (uint256 id);
    event diceBought (uint256 id);

    //list a dice for sale. Price needs to be >= value + fee
    function list(uint256 id, uint256 price) public {
       require(price >= (diceContract.getDiceValue(id) + comissionFee), "Price needs to be >= value + fee");
       require(msg.sender == diceContract.getPrevOwner(id), "Only owner can list the dice");
       listPrice[id] = price;
       emit diceListed(id, price);
    }

    function unlist(uint256 id) public {
       require(msg.sender == diceContract.getPrevOwner(id), "Only owner can unlist the dice");
       listPrice[id] = 0;
       emit diceUnlisted(id);
  }

    // get price of dice
    function checkPrice(uint256 id) public view returns (uint256) {
       return listPrice[id];
 }

    // Buy the dice at the requested price
    function buy(uint256 id) public payable {
       require(listPrice[id] != 0, "Dice is not Listed"); //is listed
       require(msg.value >= listPrice[id], "Buy price needs to be >= list price");
       address payable recipient = address(uint160(diceContract.getPrevOwner(id)));
       recipient.transfer(msg.value - comissionFee);    //transfer (price-comissionFee) to real owner
       diceContract.transfer(id, msg.sender);
       emit diceBought(id);
    }

    function getContractOwner() public view returns(address) {
       return _owner;
    }

    function withDraw() public {
        if(msg.sender == _owner)
            msg.sender.transfer(address(this).balance);
    }

}
