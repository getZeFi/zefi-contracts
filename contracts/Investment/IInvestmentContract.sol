pragma solidity ^0.5.7;

contract IInvestmentContract {
  function depositAll() external;
  function withdrawAll() external;
  function getTokenAddresses() external view returns(address[] memory);
  function calculateFee(address token, uint amount) public view returns(uint);
  function balanceOf(address owner) external view returns(uint[] memory);
}
