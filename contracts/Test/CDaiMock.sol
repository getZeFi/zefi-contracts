pragma solidity ^0.5.10;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract CDaiMock {
  IERC20 dai;
  mapping(address => uint) public balances; //balance of cDai

  constructor(address daiAddress) public {
    dai = IERC20(daiAddress);
  }

  function mint(uint amount) external returns(uint) {
    balances[msg.sender] = balances[msg.sender] + amount;
    dai.transferFrom(msg.sender, address(this), amount);
    return 0;
  }

  function redeemUnderlying(uint amount) external {
    uint totalAmount = balanceOfUnderlying(msg.sender); 
    require(totalAmount >= amount);
    dai.transfer(msg.sender, amount);
    //dai.transfer(msg.sender, amount);
    balances[msg.sender] -= (amount * 100) / 110;
  }

  function balanceOf(address owner) external view returns(uint) {
    return balances[owner];
  }

  function balanceOfUnderlying(address owner) public view returns(uint) {
    return (balances[owner] * 110) / 100;
  }
}
