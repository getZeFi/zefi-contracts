pragma solidity ^0.5.7;

import "./common/OnlyOwnerModule.sol";
import "./common/BaseModule.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title ZefiTransfer
 * @dev Module to transfer and approve tokens (ETH or ERC20) or data (contract call).
 */

contract ZefiTransfer is BaseModule, OnlyOwnerModule {
    bytes32 constant NAME = "ZefiTransfer";

    bytes4 private constant ERC1271_ISVALIDSIGNATURE_BYTES = bytes4(keccak256("isValidSignature(bytes,bytes)"));
    bytes4 private constant ERC1271_ISVALIDSIGNATURE_BYTES32 = bytes4(keccak256("isValidSignature(bytes32,bytes)"));

    // Mock token address for ETH
    address constant internal ETH_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    enum ActionType { Transfer }

    using SafeMath for uint256;

    struct TokenManagerConfig {
        // Mapping between pending action hash and their timestamp
        mapping (bytes32 => uint256) pendingActions;
    }

    // wallet specific storage
    mapping (address => TokenManagerConfig) internal configs;

    event Transfer(address indexed wallet, address indexed token, uint256 indexed amount, address to, bytes data);
    event Approved(address indexed wallet, address indexed token, uint256 amount, address spender);
    event CalledContract(address indexed wallet, address indexed to, uint256 amount, bytes data);
    event ApprovedAndCalledContract(
        address indexed wallet,
        address indexed to,
        address spender,
        address indexed token,
        uint256 amountApproved,
        uint256 amountSpent,
        bytes data
    );

    // *************** Constructor ********************** //

    constructor(
        ModuleRegistry _registry,
        GuardianStorage _guardianStorage
    )
        BaseModule(_registry, _guardianStorage, NAME)
        public
    {
    }

    /**
     * @dev Inits the module for a wallet by setting up the isValidSignature (EIP 1271)
     * @param _wallet The target wallet.
     */
    function init(BaseWallet _wallet) public onlyWallet(_wallet) {
        // setup static calls
        _wallet.enableStaticCall(address(this), ERC1271_ISVALIDSIGNATURE_BYTES);
        _wallet.enableStaticCall(address(this), ERC1271_ISVALIDSIGNATURE_BYTES32);
    }

    /**
    * @dev lets the owner transfer tokens (ETH or ERC20) from a wallet.
    * @param _wallet The target wallet.
    * @param _token The address of the token to transfer.
    * @param _to The destination address
    * @param _amount The amoutn of token to transfer
    * @param _data The data for the transaction
    */
    function transferToken(
        BaseWallet _wallet,
        address _token,
        address _to,
        uint256 _amount,
        bytes calldata _data
    )
        external
        onlyWalletOwner(_wallet)
    {
        if (_token == ETH_TOKEN) {
            invokeWallet(address(_wallet), _to, _amount, EMPTY_BYTES);
        } else {
            bytes memory methodData = abi.encodeWithSignature("transfer(address,uint256)", _to, _amount);
            invokeWallet(address(_wallet), _token, 0, methodData);
        }
        emit Transfer(address(_wallet), _token, _amount, _to, _data);
    }

    /**
    * @dev lets the owner approve an allowance of ERC20 tokens for a spender (dApp).
    * @param _wallet The target wallet.
    * @param _token The address of the token to transfer.
    * @param _spender The address of the spender
    * @param _amount The amount of tokens to approve
    */
    function approveToken( BaseWallet _wallet, address _token, address _spender, uint256 _amount) external onlyWalletOwner(_wallet) {
        bytes memory methodData = abi.encodeWithSignature("approve(address,uint256)", _spender, _amount);
        invokeWallet(address(_wallet), _token, 0, methodData);
        emit Approved(address(_wallet), _token, _amount, _spender);
    }

}