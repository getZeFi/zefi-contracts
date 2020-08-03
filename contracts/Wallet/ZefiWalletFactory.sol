pragma solidity ^0.5.7;
import "./Proxy.sol";
import "./BaseWallet.sol";
import "../Ownership/Owned.sol";
import "../Ownership/Managed.sol";
import "../upgrade/ModuleRegistry.sol";
import "../storage/IGuardianStorage.sol";

/**
 * @title ZefiWalletFactory
 * @dev The ZefiWalletFactory contract creates and assigns wallets to accounts.
 */
contract ZefiWalletFactory is Owned, Managed {

    // The address of the module dregistry
    address public moduleRegistry;
    // The address of the base wallet implementation
    address public walletImplementation;
    // The address of the GuardianStorage
    address public guardianStorage;

    // *************** Events *************************** //

    event ModuleRegistryChanged(address addr);
    event GuardianStorageChanged(address addr);
    event WalletCreated(address indexed wallet, address indexed owner, address indexed guardian);

    // *************** Modifiers *************************** //

    /**
     * @dev Throws if the guardian storage address is not set.
     */
    modifier guardianStorageDefined {
        require(guardianStorage != address(0), "GuardianStorage address not defined");
        _;
    }

    // *************** Constructor ********************** //

    /**
     * @dev Default constructor.
     */
    constructor(address _moduleRegistry, address _walletImplementation) public {
        moduleRegistry = _moduleRegistry;
        walletImplementation = _walletImplementation;
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
        _createCounterfactualWallet(_owner, _modules, address(0), _salt);
    }

    /**
     * @dev Lets the manager create a wallet for an owner account at a specific address.
     * The wallet is initialised with a list of modules and a first guardian.
     * The wallet is created using the CREATE2 opcode.
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _guardian The guardian address.
     * @param _salt The salt.
     */
    function createCounterfactualWalletWithGuardian(
        address _owner,
        address[] calldata _modules,
        address _guardian,
        bytes32 _salt
    )
        external
        onlyManager
        guardianStorageDefined
    {
        require(_guardian != (address(0)), "WF: guardian cannot be null");
        _createCounterfactualWallet(_owner, _modules, _guardian, _salt);
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
        _wallet = _getAddressForCounterfactualWallet(_owner, _modules, address(0), _salt);
    }

    /**
     * @dev Gets the address of a counterfactual wallet with a first default guardian.
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _guardian The guardian address.
     * @param _salt The salt.
     * @return the address that the wallet will have when created using CREATE2 and the same input parameters.
     */
    function getAddressForCounterfactualWalletWithGuardian(
        address _owner,
        address[] calldata _modules,
        address _guardian,
        bytes32 _salt
    )
        external
        view
        returns (address _wallet)
    {
        require(_guardian != (address(0)), "WF: guardian cannot be null");
        _wallet = _getAddressForCounterfactualWallet(_owner, _modules, _guardian, _salt);
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
     * @dev Lets the owner change the address of the GuardianStorage contract.
     * @param _guardianStorage The address of the GuardianStorage contract.
     */
    function changeGuardianStorage(address _guardianStorage) external onlyOwner {
        require(_guardianStorage != address(0), "WF: address cannot be null");
        guardianStorage = _guardianStorage;
        emit GuardianStorageChanged(_guardianStorage);
    }

    /**
     * @dev Inits the module for a wallet by logging an event.
     * The method can only be called by the wallet itself.
     * @param _wallet The wallet.
     */
    function init(BaseWallet _wallet) external pure { // solium-disable-line no-empty-blocks
        //do nothing
    }

    // *************** Internal Functions ********************* //

    /**
     * @dev Helper method to create a wallet for an owner account at a specific address.
     * The wallet is initialised with a list of modules and a first guardian.
     * The wallet is created using the CREATE2 opcode.
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _guardian The guardian address.
     * @param _salt The salt.
     */
    function _createCounterfactualWallet(
        address _owner,
        address[] memory _modules,
        address _guardian,
        bytes32 _salt
    )
        internal
    {
        _validateInputs(_owner, _modules);
        bytes32 newsalt = _newSalt(_salt, _owner, _modules, _guardian);
        bytes memory code = abi.encodePacked(type(Proxy).creationCode, uint256(walletImplementation));
        address payable wallet;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            wallet := create2(0, add(code, 0x20), mload(code), newsalt)
            if iszero(extcodesize(wallet)) { revert(0, returndatasize) }
        }
        _configureWallet(BaseWallet(wallet), _owner, _modules, _guardian);
    }

    /**
     * @dev Helper method to configure a wallet for a set of input parameters.
     * @param _wallet The target wallet
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _guardian (Optional) The guardian address.
     */
    function _configureWallet(
        BaseWallet _wallet,
        address _owner,
        address[] memory _modules,
        address _guardian
    )
        internal
    {
        // add the factory to modules so it can add a guardian
        address[] memory extendedModules = new address[](_modules.length + 1);
        extendedModules[0] = address(this);
        for (uint i = 0; i < _modules.length; i++) {
            extendedModules[i + 1] = _modules[i];
        }
        // initialise the wallet with the owner and the extended modules
        _wallet.init(_owner, extendedModules);
        // add guardian if needed
        if (_guardian != address(0)) {
            IGuardianStorage(guardianStorage).addGuardian(_wallet, _guardian);
        }
        // remove the factory from the authorised modules
        _wallet.authoriseModule(address(this), false);
        // emit event
        emit WalletCreated(address(_wallet), _owner, _guardian);
    }
    /**
     * @dev Gets the address of a counterfactual wallet.
     * @param _owner The account address.
     * @param _modules The list of modules.
     * @param _salt The salt.
     * @param _guardian (Optional) The guardian address.
     * @return the address that the wallet will have when created using CREATE2 and the same input parameters.
     */
    function _getAddressForCounterfactualWallet(
        address _owner,
        address[] memory _modules,
        address _guardian,
        bytes32 _salt
    )
        internal
        view
        returns (address _wallet)
    {
        bytes32 newsalt = _newSalt(_salt, _owner, _modules, _guardian);
        bytes memory code = abi.encodePacked(type(Proxy).creationCode, uint256(walletImplementation));
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), newsalt, keccak256(code)));
        _wallet = address(uint160(uint256(hash)));
    }

    /**
     * @dev Generates a new salt based on a provided salt, an owner, a list of modules and an optional guardian.
     * @param _salt The slat provided.
     * @param _owner The owner address.
     * @param _modules The list of modules.
     * @param _guardian The guardian address.
     */
    function _newSalt(bytes32 _salt, address _owner, address[] memory _modules, address _guardian) internal pure returns (bytes32) {
        if (_guardian == address(0)) {
            return keccak256(abi.encodePacked(_salt, _owner, _modules));
        } else {
            return keccak256(abi.encodePacked(_salt, _owner, _modules, _guardian));
        }
    }

    /**
     * @dev Throws if the owner and the modules are not valid.
     * @param _owner The owner address.
     * @param _modules The list of modules.
     */
    function _validateInputs(address _owner, address[] memory _modules) internal view {
        require(_owner != address(0), "WF: owner cannot be null");
        require(_modules.length > 0, "WF: cannot assign with less than 1 module");
        require(ModuleRegistry(moduleRegistry).isRegisteredModule(_modules), "WF: one or more modules are not registered");
    }
}
