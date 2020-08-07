pragma solidity ^0.5.7;

import "./common/BaseModule.sol";
import "./common/OnlyOwnerModule.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title EscrowManager
 * @dev EscrowManager to create and receive payments that could be used
 * by both Zefi and Non Zefi users.
 */
contract EscrowManager is BaseModule, OnlyOwnerModule {
    bytes32 constant NAME = "EscrowManager";

    // Mock token address of ETH
    address constant internal ETH_TOKEN_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

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
     * @param _wallet The target wallet.
     * @param _amount The amount to create payment.
     * @param _paymentTokenHash The hash of the payment token.
     * @return Returns true in case payment is successfully created.
     */
    function createETHPayment(
        BaseWallet _wallet,
        uint256 _amount,
        bytes32 _paymentTokenHash)
            external onlyWalletOwner(_wallet)
            returns (bool _success)
    {
        require(_amount > 0, "EscrowManger: value is less than zero");
        require(_paymentTokenHash > 0, "EscrowManger: invalid payment token");
        payments[_paymentTokenHash] = Payment(
            address(_wallet),
            _amount,
            ETH_TOKEN_ADDRESS,
            false
        );
        _success = true;
        emit ETHTokenPaymentCreated(address(_wallet), _paymentTokenHash);
        return _success;
    }

    /**
     * @dev Create payment for ERC20 Tokens.
     * @param _wallet The target wallet.
     * @param _amount The amount to create payment.
     * @param _paymentTokenHash The hash of the payment token.
     * @return Returns true in case payment is successfully created.
     */
    function createTokenPayment(
        BaseWallet _wallet,
        uint256 _amount,
        bytes32 _paymentTokenHash,
        address _tokenAddress)
            external onlyWalletOwner(_wallet)
            returns (bool _success)
    {
        require(_amount > 0, "EscrowManger: value is less than zero");
        require(_paymentTokenHash > 0, "EscrowManger: invalid payment token");
        require(_tokenAddress != address(0x0), "EscrowManger: invalid token address");
        payments[_paymentTokenHash] = Payment(
            address(_wallet),
            _amount,
            _tokenAddress,
            false
        );
        _success = true;
        emit ERC20TokenPaymentCreated(address(_wallet), _paymentTokenHash);
        return _success;
    }

    /**
     * @dev Sends ETH or ERC20 token using payment token hash.
     * @param _wallet The target wallet.
     * @param _paymentToken The hash of the payment token.
     * @param _to Recipient of the payment.
     * @return Returns true in case payment is successfully processed.
     */
    function sendPayment(
        BaseWallet _wallet,
        bytes32 _paymentToken,
        address payable _to)
            external onlyWalletOwner(_wallet)
            returns (bool _success)
    {
        bytes32 paymentTokenHash = keccak256(abi.encodePacked(_paymentToken));
        Payment storage payment = payments[paymentTokenHash];
        require(payment.value != 0, "EscrowManger: wrong _paymentToken");
        require(payment.sent == false, "EscrowManger: payment already sent");
        _success = true;
        if (payment.token == address(0)) {
            _to.transfer(payment.value);
            emit ETHSendPaymentExecuted(address(_wallet), _success);
        } else {
            _success = IERC20(payment.token).transfer(_to, payment.value);
            emit ERC20SendPaymentExecuted(address(_wallet), _success);
        }
        payment.sent = true;
        return _success;
    }
}