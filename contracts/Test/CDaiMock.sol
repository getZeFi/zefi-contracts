pragma solidity 0.5.10;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract CDaiMock {
  IERC20 dai;
  mapping(address => uint) public balances; //balance of cDai
  uint public totalBalance;

  constructor(address daiAddress) public {
    dai = IERC20(daiAddress);
  }

  function mint(uint amount) external returns(uint) {
    dai.transferFrom(msg.sender, address(this), amount);
    uint cDaiAmount = amount * 1 ether / _getSharePrice();
    balances[msg.sender] += cDaiAmount; 
    totalBalance += cDaiAmount; 
    return 0;
  }

  function redeemUnderlying(uint amount) external {
    uint totalAmount = balanceOfUnderlying(msg.sender); 
    require(totalAmount >= amount);
    uint cDaiAmount = amount * 1 ether / _getSharePrice();
    dai.transfer(msg.sender, amount);
    balances[msg.sender] -= cDaiAmount; 
    totalBalance -= cDaiAmount; 
  }

  function balanceOf(address owner) external view returns(uint) {
    return balances[owner];
  }

  function balanceOfUnderlying(address owner) public view returns(uint) {
    return _getSharePrice() * balances[owner] / 1 ether; 
  }

  function _getSharePrice() internal view returns(uint) {
    uint daiTotalBalance = dai.balanceOf(address(this));
    return totalBalance == 0 ? 1 ether : daiTotalBalance * 1 ether / totalBalance;
  }
}
