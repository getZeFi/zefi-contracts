pragma solidity ^0.5.10;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract Escrow {
  struct Payment {
    address from; //could be used for events
    uint value; //can be ether or token amount
    address token; //if not null this an ERC20 token transfer
    bool sent;
  }
  //payment tokens to Payment
  mapping(bytes32 => Payment) public payments; 

  event IERC20TransactionExecuted(address indexed sender, bool indexed success);

  function createEthPayment(
    bytes32 _paymentTokenHash 
  ) 
    external
    payable
  {
    _createPayment(
      _paymentTokenHash,
      msg.sender,
      msg.value,
      address(0)
    );
  }

  function createTokenPayment(
    bytes32 _paymentTokenHash,
    uint _value,
    address _tokenAddress
  ) 
    external 
    payable 
  {
    bool success = IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _value); 
    emit IERC20TransactionExecuted(msg.sender, success);
    _createPayment(
      _paymentTokenHash,
      msg.sender,
      _value,
      _tokenAddress
    );
  }

  function _createPayment(
    bytes32 _paymentTokenHash,
    address _from,
    uint _value,
    address _tokenAddress
  ) 
    internal 
  {
    payments[_paymentTokenHash] = Payment(
      _from,
      _value,
      _tokenAddress,
      false
    );
  }

  function sendPayment(bytes32 _paymentToken, address payable _to) external {
    bytes32 paymentTokenHash = keccak256(abi.encodePacked(_paymentToken));
    Payment storage payment = payments[paymentTokenHash];
    require(payment.value != 0, 'wrong _paymentToken'); 
    require(payment.sent == false, 'payment already sent'); 

    if(payment.token == address(0)) {
      _to.transfer(payment.value);
    } else {
      bool success =IERC20(payment.token).transfer(_to, payment.value);
      emit IERC20TransactionExecuted(msg.sender, success);
    }
    payment.sent = true;
  }
}
