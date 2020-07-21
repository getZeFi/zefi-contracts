pragma solidity ^0.5.7;
import "../../Wallet/BaseWallet.sol";
import "../../modules/common/OnlyOwnerModule.sol";

/**
 * @title TestModule
 * @dev Basic test module.
 */
contract TestOnlyOwnerModule is OnlyOwnerModule {

    bytes32 constant NAME = "TestOnlyOwnerModule";
    constructor(ModuleRegistry _registry) BaseModule(_registry, NAME) public {}
}