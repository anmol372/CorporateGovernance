var Ballot = artifacts.require("Ballot");
 
module.exports = function(deployer) {
  deployer.deploy(Ballot,"How To Spend Profits for the financial year of 2019","Give Dividends to Share Holders",1); 
  //the smart contract expects three values during creation:
  //1. Ballot Name/Question
  //2. Ballot Proposal
  //3. Ballot Access Level : int value of 1: open to all investors
  //									  3: open to managers and directors of the corporation
  //									  5: open to directors of the corporation.
};

