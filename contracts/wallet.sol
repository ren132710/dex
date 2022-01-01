// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//hardhat does not need full filepath in order to compile
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {
  using SafeMath for uint256;

  //Wallet Storage
  struct Token {
    bytes32 ticker;
    address tokenAddress; //we need the address of the token to be able to do transfer calls
  }

  Token[] Tokens;

  mapping(bytes32 => Token) public tokenMapping;
  bytes32[] public tokenList; //enumerate and loop through tokens

  //maps address,ticker to a balance
  mapping(address => mapping(bytes32 => uint256)) public balances; //bytes32 supports comparing strings

  modifier tokenExists(bytes32 ticker) {
    require(tokenMapping[ticker].tokenAddress != address(0), "Wallet: Token does not exist");
    _;
  }

  function getTokenList() public view returns (bytes32[] memory) {
      return tokenList;
  }

  function getMyEthBalance() public view returns (uint256) {
      return balances[msg.sender][bytes32("ETH")];
  }

  function getMyTokenBalance(bytes32 ticker) public view returns (uint256) {
      return balances[msg.sender][ticker];
  }

  function addToken(bytes32 ticker, address tokenAddress) external onlyOwner { //make the function external to save on gas
    tokenMapping[ticker] = Token(ticker, tokenAddress); //create the token in the struct
    tokenList.push(ticker); //then add it to the token list
  }

  function depositToken(uint256 amount, bytes32 ticker) external tokenExists(ticker) {
    balances[msg.sender][ticker] = balances[msg.sender][ticker].add(amount);  //effects
    IERC20(tokenMapping[ticker].tokenAddress).transferFrom(msg.sender, address(this), amount); //interactions, transfer from msg.sender (them) to this contract (us)
  }

  function withdrawToken(uint256 amount, bytes32 ticker) external tokenExists(ticker) {
    require(balances[msg.sender][ticker] >= amount, "Wallet: Balance not sufficient"); //checks
    balances[msg.sender][ticker] = balances[msg.sender][ticker].sub(amount); //effects
    IERC20(tokenMapping[ticker].tokenAddress).transfer(msg.sender, amount); //interactions, transfer from this contract (us) to msg.sender (them)
  }

  function depositETH() external payable {
    require(msg.value > 0, "DEX: ETH transfer should be greater than 0");
    balances[msg.sender][bytes32("ETH")]= balances[msg.sender][bytes32("ETH")].add(msg.value);
  }

  function withdrawEth(uint256 amount) external {
      require(balances[msg.sender][bytes32("ETH")] >= amount,'Insuffient balance');
      balances[msg.sender][bytes32("ETH")] = balances[msg.sender][bytes32("ETH")].sub(amount);
      //(bool success, bytes memory data) = msg.sender.call{value:amount}(""); //what does this do?
  }

}
