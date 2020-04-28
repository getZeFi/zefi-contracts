pragma solidity ^0.5.10;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract InvestmentContractBase {
  using SafeMath for uint;

  uint constant FEE = 1000; //fee on compound interest, in basis points
  uint constant BASIS_POINT_DENOMINATOR = 10000;
  address public zefiWallet;
  //token address => owner address => amount invested in cToken
  mapping(address => mapping(address => uint)) public tokenInvested;
}
