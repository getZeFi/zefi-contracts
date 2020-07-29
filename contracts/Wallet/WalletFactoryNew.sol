pragma solidity ^0.5.7;

import "./Proxy.sol";
import "./BaseWallet.sol";
import "../Ownership/Owned.sol";
import "../Ownership/Managed.sol";
import "../upgrade/ModuleRegistry.sol";

/**
 * @title WalletFactoryNew
 * @dev The WalletFactoryNew contract creates wallets for accounts
 */
contract WalletFactoryNew is Owned, Managed {

    // The address of the module registry
    address public moduleRegistry;
    // The address of the base wallet implementation
    address public walletImplementation;

    // *************** Events *************************** //

    event ModuleRegistryChanged(address addr);
    event ZefiWalletCreated(address indexed wallet, address indexed owner);

    // *************** Constructor ********************** //

    /**
     * @dev Default constructor.
     */
    constructor(address _moduleRegistry, address _walletImplementation) public {
        moduleRegistry = _moduleRegistry;
        walletImplementation = _walletImplementation;
    }

    /**
     * @dev Gets the address of a counterfactual wallet.
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _salt The salt.
     * @return the address that the wallet will have when created using CREATE2 and the same input parameters.
     */
    function getAddressForCounterfactualWallet(
        address _owner,
        address[] calldata _modules,
        bytes32 _salt
    )
        external
        view
        returns (address _wallet)
    {
        bytes32 newsalt = createSalt(_salt, _owner, _modules);
        bytes memory code = abi.encodePacked(type(Proxy).creationCode, uint256(walletImplementation));
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), newsalt, keccak256(code)));
        _wallet = address(uint160(uint256(hash)));
    }

    /**
     * @dev Lets the manager create a wallet for an owner account at a specific address.
     * The wallet is initialised with a list of modules.
     * The wallet is created using the CREATE2 opcode.
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _salt The salt.
     */
    function createCounterfactualWallet(
        address _owner,
        address[] calldata _modules,
        bytes32 _salt
    )
        external
        onlyManager
    {
        validateInput(_owner, _modules);
        bytes32 newsalt = createSalt(_salt, _owner, _modules);
        bytes memory code = abi.encodePacked(type(Proxy).creationCode, uint256(walletImplementation));
        address payable wallet;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            wallet := create2(0, add(code, 0x20), mload(code), newsalt)
            //if iszero(extcodesize(wallet)) { revert(0, returndatasize) }
        }
        setupWallet(BaseWallet(wallet), _owner, _modules);
    }

    /**
     * @dev Lets the owner change the address of the module registry contract.
     * @param _moduleRegistry The address of the module registry contract.
     */
    function changeModuleRegistry(address _moduleRegistry) external onlyOwner {
        require(_moduleRegistry != address(0), "WF: address cannot be null");
        moduleRegistry = _moduleRegistry;
        emit ModuleRegistryChanged(_moduleRegistry);
    }

    /**
     * @dev Helper method to configure a wallet for a set of input parameters.
     * @param _wallet The target wallet
     * @param _owner The account address.
     * @param _modules The list of modules.
     */
    function setupWallet(
        BaseWallet _wallet,
        address _owner,
        address[] memory _modules
    )
        internal
    {
        // add the factory to modules
        address[] memory extendedModules = new address[](_modules.length + 1);
        extendedModules[0] = address(this);
        for (uint i = 0; i < _modules.length; i++) {
            extendedModules[i + 1] = _modules[i];
        }
        // initialise the wallet with the owner and the extended modules
        _wallet.init(_owner, extendedModules);
        // remove the factory from the authorised modules
        _wallet.authoriseModule(address(this), false);
        // emit event
        emit ZefiWalletCreated(address(_wallet), _owner);
    }

    /**
     * @dev Generates a new salt based on a provided salt, an owner and a list of modules.
     * @param _salt The slat provided.
     * @param _owner The owner address.
     * @param _modules The list of modules.
     */
    function createSalt(bytes32 _salt, address _owner, address[] memory _modules) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_salt, _owner, _modules));
    }

    /**
     * @dev Throws if the owner and the modules are not valid.
     * @param _owner The owner address.
     * @param _modules The list of modules.
     */
    function validateInput(address _owner, address[] memory _modules) internal view {
        require(_owner != address(0), "WF: owner cannot be null");
        require(_modules.length > 0, "WF: cannot assign with less than 1 module");
        require(ModuleRegistry(moduleRegistry).isRegisteredModule(_modules), "WF: one or more modules are not registered");
    }
}