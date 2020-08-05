pragma solidity ^0.5.7;
import "../../Wallet/BaseWallet.sol";
import "../common/BaseModule.sol";
import "../common/OnlyOwnerModule.sol";
import "./SafeMath.sol";
// import "./ERC20.sol";
// import "./KyberNetwork.sol";

/**
 * @title KyberModule
 * @dev Module to trade tokens (ETH or ERC20) using KyberNetworks.
 */
contract KyberModule is BaseModule, OnlyOwnerModule {}