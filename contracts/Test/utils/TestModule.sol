pragma solidity ^0.5.7;

import "../../modules/common/BaseModule.sol";
import "../../modules/common/RelayerModule.sol";
import "../../modules/common/OnlyOwnerModule.sol";
import "./TestDapp.sol";

/**
 * @title TestModule
 * @dev Test Module
 */
contract TestModule  is BaseModule, RelayerModule, OnlyOwnerModule {
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

    // *************** Implementation of RelayerModule methods ********************* //

    // Overrides to use the incremental nonce and save some gas
    function checkAndUpdateUniqueness(BaseWallet _wallet, uint256 _nonce, bytes32 /* _signHash */) internal returns (bool) {
        return checkAndUpdateNonce(_wallet, _nonce);
    }

    function validateSignatures(
        BaseWallet _wallet,
        bytes memory /* _data */,
        bytes32 _signHash,
        bytes memory _signatures
    )
        internal
        view
        returns (bool)
    {
        address signer = recoverSigner(_signHash, _signatures, 0);
        return isOwner(_wallet, signer); // "GM: signer must be owner"
    }

    function getRequiredSignatures(BaseWallet /* _wallet */, bytes memory /*_data */) internal view returns (uint256) {
        return 1;
    }
}