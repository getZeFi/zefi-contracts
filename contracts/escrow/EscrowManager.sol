pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title EscrowManager
 * @dev EscrowManager to create and receive payments that could be used
 * by both Zefi and Non Zefi users.
 */
contract EscrowManager {
    /**
     * @notice Container for payment request detail
     * @member from Payment creator
     * @member value Value of the payment
     * @member token Represents ERC20 token, otherwise null
     * @member sent Flag to check if payment is already redeemed
     */
    struct Payment {
        address from;
        uint value;
        address token;
        bool sent;
    }

    /**
     * @notice Mapping of payment to payment detail
     */
    mapping(bytes32 => Payment) public payments;

    event ETHTokenPaymentCreated(address indexed sender, bytes32 indexed paymentTokenHash);
    event ERC20TokenPaymentCreated(address indexed sender, bytes32 indexed paymentTokenHash);
    event ETHSendPaymentExecuted(address indexed sender, bool indexed success);
    event ERC20SendPaymentExecuted(address indexed sender, bool indexed success);

    /**
     * @dev Create payment for ETH.
     * @param _paymentTokenHash The hash of the payment token.
     * @return Returns true in case payment is successfully created.
     */
    function createETHPayment(
        bytes32 _paymentTokenHash)
            external
            payable
            returns (bool _success)
    {
        require(_paymentTokenHash > 0, "EscrowManger: invalid payment token");
        payments[_paymentTokenHash] = Payment(
            msg.sender,
            msg.value,
            address(0),
            false
        );
        _success = true;
        emit ETHTokenPaymentCreated(msg.sender, _paymentTokenHash);
        return _success;
    }

    /**
     * @dev Create payment for ERC20 Tokens.
     * @param _amount The amount to create payment.
     * @param _paymentTokenHash The hash of the payment token.
     * @param _tokenAddress Address of ERC20 token.
     * @return Returns true in case payment is successfully created.
     */
    function createTokenPayment(
        uint _amount,
        bytes32 _paymentTokenHash,
        address _tokenAddress)
            external
            returns (bool _success)
    {
        require(_tokenAddress != address(0x0), "EscrowManger: invalid token address");
        _success = IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);

        payments[_paymentTokenHash] = Payment(
            msg.sender,
            _amount,
            _tokenAddress,
            false
        );

        emit ERC20TokenPaymentCreated(msg.sender, _paymentTokenHash);
        return _success;
    }

    /**
     * @dev Sends ETH or ERC20 token using payment token hash.
     * @param _paymentToken The hash of the payment token.
     * @param _to Recipient of the payment.
     * @return Returns true in case payment is successfully processed.
     */
    function sendPayment(
        bytes32 _paymentToken,
        address payable _to)
            external
            returns (bool _success)
    {
        require(_to != address(0x0), "Escrow: Invalid Address");
        bytes32 paymentTokenHash = keccak256(abi.encodePacked(_paymentToken, msg.sender));
        Payment storage payment = payments[paymentTokenHash];
        require(payment.value != 0, "wrong _paymentToken");
        require(payment.sent == false, "EscrowManger: payment already sent");
        _success = true;
        if (payment.token == address(0)) {
            _to.transfer(payment.value);
            emit ETHSendPaymentExecuted(msg.sender, _success);
        } else {
            _success = IERC20(payment.token).transfer(_to, payment.value);
            emit ERC20SendPaymentExecuted(msg.sender, _success);
        }
        payment.sent = _success;
        return _success;
    }
}