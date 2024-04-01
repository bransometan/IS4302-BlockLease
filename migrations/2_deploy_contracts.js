const Dice = artifacts.require("Dice");
const DiceBattle = artifacts.require("DiceBattle");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(Dice).then(function() {
        return deployer.deploy(DiceBattle, Dice.address);
    })
}