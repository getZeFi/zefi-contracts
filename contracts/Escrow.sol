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
    IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _value); 
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
    bytes32 msgSender = keccak256(abi.encodePacked(msg.sender));
    bytes32 paymentTokenHash = keccak256(abi.encodePacked(_paymentToken));
    bytes memory paymentTokenHashWithSender = concat(msgSender, paymentTokenHash);
    Payment storage payment = payments[paymentTokenHashWithSender];
    require(payment.value != 0, 'wrong _paymentToken'); 
    require(payment.sent == false, 'payment already sent'); 

    if(payment.token == address(0)) {
      _to.transfer(payment.value);
    } else {
      IERC20(payment.token).transfer(_to, payment.value);
    }
    payment.sent = true;
  }

  // *************** Internal Functions ********************* //

 /**
  * @dev Concatenate two bytes32 into one bytes of size 64.
  * @param b1 First bytes32 value
  * @param b2 second bytes32 value
  * @return A concatenated value of b1 and b2 of size 64
 */
 function concat(bytes32 b1, bytes32 b2) internal returns (bytes memory)
 {
     bytes memory result = new bytes(64);
     assembly {
         mstore(add(result, 32), b1)
         mstore(add(result, 64), b2)
     }
     return result;
 }

}
