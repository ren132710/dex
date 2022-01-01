// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//hardhat does not need full filepath in order to compile
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//Mock ERC20 token contract for testing Wallet
contract Link is ERC20 {

  //constructor (string memory name, string memory symbol) ERC20(name, symbol) public {
  constructor () ERC20("Chainlink", "LINK") public {
    _mint(msg.sender, 1000);
  }

}
