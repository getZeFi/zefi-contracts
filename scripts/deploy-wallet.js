const walletUtils = require('./wallet-utils.js');
const CloneableWallet = artifacts.require('./Wallet/CloneableWallet.sol');
const WalletFactory = artifacts.require("./WalletFactory/WalletFactory.sol");

module.exports = async done => { 
  const { walletFactory } = await walletUtils.deployFactory(CloneableWallet, WalletFactory);
  const accounts = await web3.eth.getAccounts();
  const receipt = await walletFactory.deployCloneWallet(
    accounts[0],
    accounts[1],
    accounts[1],
  );
  console.log(receipt.receipt.logs[0].args.wallet);
  done();
}
