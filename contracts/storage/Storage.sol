pragma solidity ^0.5.7;
import "../Wallet/BaseWallet.sol";

/**
 * @title Storage
 * @dev Base contract for the storage of a wallet.
 */
contract Storage {

    /**
     * @dev Throws if the caller is not an authorised module.
     */
    modifier onlyModule(BaseWallet _wallet) {
        require(_wallet.authorised(msg.sender), "TS: must be an authorized module to call this method");
        _;
    }
}