// /**
//  * These are not strictly needed for tests; however since the tests
//  * run deployments anyways it is nice to know that the contracts deploy, as 
//  * it seems there are issues you can unearth when attempting to deploy
//  */

const WalletFactory = artifacts.require("./WalletFactory/WalletFactory.sol");
const CloneableWallet = artifacts.require('./Wallet/CloneableWallet.sol');

module.exports = async function (deployer) {
    await deployer.deploy(CloneableWallet);
    await deployer.deploy(WalletFactory, CloneableWallet.address);
};
