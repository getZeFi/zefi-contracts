pragma solidity ^0.5.7;

import "../../modules/common/BaseModule.sol";
import "../../modules/common/OnlyOwnerModule.sol";
import "./TestDapp.sol";

/**
 * @title TestModule
 * @dev Test Module
 */
contract TestModule  is BaseModule, OnlyOwnerModule {
    bytes32 constant NAME = "TestModule";

    TestDapp public dapp;

    // *************** Constructor ********************** //

    constructor(
        ModuleRegistry _registry
    )
        BaseModule(_registry, GuardianStorage(0), NAME)
        public
    {
        dapp = new TestDapp();
    }

    function callDapp(address _wallet)
        external
    {
        invokeWallet(_wallet, address(dapp), 0, abi.encodeWithSignature("noReturn()"));
    }

    function callDapp2(address _wallet, uint256 _val, bool _isNewWallet)
        external returns (uint256 _ret)
    {
        bytes memory result = invokeWallet(_wallet, address(dapp), 0, abi.encodeWithSignature("uintReturn(uint256)", _val));
        if (_isNewWallet) {
            require(result.length > 0, "NewTestModule: callDapp2 returned no result");
            (_ret) = abi.decode(result, (uint256));
            require(_ret == _val, "NewTestModule: invalid val");
        } else {
            require(result.length == 0, "NewTestModule: callDapp2 returned some result");
        }
    }

    function fail(address _wallet, string calldata reason) external {
        invokeWallet(_wallet, address(dapp), 0, abi.encodeWithSignature("doFail(string)", reason));
    }
}