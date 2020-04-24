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
  uint public totalDaiInvested;
  uint constant FEE = 1000; //fee on compound interest, in basis points
  uint constant BASIS_POINT_DENOMINATOR = 10000;
  address public admin;

  constructor(address daiAddress, address cDaiAddress, address _admin) public {
    dai = IERC20(daiAddress);
    cDai = CDai(cDaiAddress);
    admin = _admin;
  }

  function depositAll() external {
    //1. get balance in Dai
    uint amount = dai.balanceOf(msg.sender);
    if(amount == 0) return;

    //2. send dai to this contract
    dai.transferFrom(msg.sender, address(this), amount);

    //3. update how much dai was invested
    daiInvested[msg.sender] = daiInvested[msg.sender].add(amount);
    totalDaiInvested = totalDaiInvested.add(amount);

    //4. Approve dai to be sent to compound
    dai.approve(address(cDai), amount);

    //5. send dai to cDai
    assert(cDai.mint(amount) == 0);
  }

  function withdrawAll() external {
    //1. withdraw dai from cDai
    uint daiBalance = cDai.balanceOfUnderlying(address(this));
    uint amount = daiBalance.mul(daiInvested[msg.sender]).div(totalDaiInvested);
    cDai.redeemUnderlying(amount);

    //2. transfer fee
    uint fee = calculateFee(amount);
    dai.transfer(admin, fee); 

    //3. transfer dai to caller 
    dai.transfer(msg.sender, amount.sub(fee));
   
    //4. update internal dai balance
    totalDaiInvested = totalDaiInvested.sub(daiInvested[msg.sender]);
    daiInvested[msg.sender] = 0;
  }

  function getTokenAddress() external view returns(address) {
    return address(dai);
  }

  function calculateFee(uint amount) public view returns(uint) {
    uint interestEarned = amount.sub(daiInvested[msg.sender]);
    return interestEarned.mul(FEE).div(BASIS_POINT_DENOMINATOR);
  }

  function balanceOf(address owner) external view returns(uint) {
    uint daiBalance = cDai.balanceOfUnderlying(address(this));
    uint amount = daiBalance.mul(daiInvested[owner]).div(totalDaiInvested);
    uint fee = calculateFee(amount);
    return amount.sub(fee);
  }
}
