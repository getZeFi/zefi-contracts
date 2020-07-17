pragma solidity ^0.5.7;

/// @title FullWalletByteCode
/// @dev A contract containing the FullWallet bytecode, for use in deployment.
contract FullWalletByteCode {
    /// @notice This is the raw bytecode of the full wallet. It is encoded here as a raw byte
    ///  array to support deployment with CREATE2, as Solidity's 'new' constructor system does
    ///  not support CREATE2 yet.
    ///
    ///  NOTE: Be sure to update this whenever the wallet bytecode changes!
    ///  Simply run `npm run build` and then copy the `"bytecode"`
    ///  portion from the `build/contracts/FullWallet.json` file to here,
    ///  then append 64x3 0's.
    bytes constant fullWalletBytecode = "60806040523480156200001157600080fd5b5";
}

