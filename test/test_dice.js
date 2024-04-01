// Require contracts to be deployed and assertion frameworks initialisation
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require('truffle-assertions');
var assert = require('assert');

// Create variables to represent contracts
var Dice = artifacts.require("../contracts/Dice.sol");
var DiceBattle = artifacts.require("../contracts/DiceBattle.sol");

// Establish Testing (Wait for 2 contracts to be deployed before any testing occur)
contract('DiceBattle', function(accounts) {
    before(async () => {
        diceInstance = await Dice.deployed();
        diceBattleInstance = await DiceBattle.deployed();
    });
    console.log("Testing Trade Contract");

    // Test 1 -> Get Dice
    it ('Get Dice', async () => {
        let makeD1 = await diceInstance.add(1, 1, {from: accounts[1], value: 100000000000000000});
        let makeD2 = await diceInstance.add(30, 1, {from: accounts[2], value: 100000000000000000});

        assert.notStrictEqual(
            makeD1,
            undefined,
            "Failed to make dice"
        );

        assert.notStrictEqual(
            makeD2,
            undefined,
            "Failed to make dice"
        );
    })

    
    // Test 2 -> Transfer Ownership
    it ('transfer ownership of dice', async () => {
        let t1 = await diceInstance.transfer(0, diceBattleInstance.address, {from: accounts[1]});
        let t2 = await diceInstance.transfer(1, diceBattleInstance.address, {from: accounts[2]});

        let enemy_adj1 = await diceBattleInstance.setBattlePair(accounts[2], {from: accounts[1]});
        let enemy_adj2 = await diceBattleInstance.setBattlePair(accounts[1], {from: accounts[2]});

        truffleAssert.eventEmitted(enemy_adj1, "add_enemy");
        truffleAssert.eventEmitted(enemy_adj2, "add_enemy");
    })

    // Test 3 -> Test Dice Battle Battle Working
    it ('DiceBattle working properly', async () => {
        let doBattle = await diceBattleInstance.battle(0, 1, {from: accounts[1]});
        console.log(doBattle);
        truffleAssert.eventEmitted(doBattle, 'battlewin');
    })


})



