pragma solidity ^0.5.10;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

interface CDai {
  function mint(uint amount) external returns(uint);
  function redeemUnderlying(uint amount) external;
  function balanceOf(address owner) external view returns(uint);
  function balanceOfUnderlying(address owner) external view returns(uint);
}

contract InvestmentContract {
  using SafeMath for uint;

  IERC20 dai;
  CDai cDai;
  mapping(address => uint) public daiInvested;
  uint constant FEE = 1000; //fee on compound interest, in basis points
  uint constant BASIS_POINT_DENOMINATOR = 10000;
  address public admin;

  constructor(address daiAddress, address cDaiAddress, address _admin) public {
    dai = IERC20(daiAddress);
    cDai = CDai(cDaiAddress);
    admin = _admin;
  }

  function deposit(uint amount) external {
    //1. send dai to this contract
    dai.transferFrom(msg.sender, address(this), amount);

    //2. update how much dai was invested
    daiInvested[msg.sender] = daiInvested[msg.sender].add(amount);

    //3. Approve dai to be sent to compound
    dai.approve(address(cDai), amount);

    //4. send dai to cDai
    assert(cDai.mint(amount) == 0);
  }

  function withdraw() external {
    //1. withdraw dai from cDai
    uint daiBalance = cDai.balanceOfUnderlying(address(this));
    //uint daiBalance = cDai.balanceOf(address(this));
    cDai.redeemUnderlying(daiBalance);

    //2. transfer fee
    uint interestEarned = daiBalance.sub(daiInvested[msg.sender]);
    uint fee = interestEarned.mul(FEE).div(BASIS_POINT_DENOMINATOR);
    dai.transfer(admin, fee); 

    //3. transfer dai to caller 
    dai.transfer(msg.sender, daiBalance.sub(fee));
   
    //4. update internal dai balance
    daiInvested[msg.sender] = 0;
  }
}
