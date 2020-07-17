pragma solidity ^0.5.7;

contract Storage {
  uint public data;

  function set(uint _data) external {
    data = _data;
  }
}
