const WalletFactory = artifacts.require("./WalletFactory/WalletFactory.sol");
const CloneableWallet = artifacts.require('./Wallet/CloneableWallet.sol');

//const Storage = artifacts.require('Test/Storage.sol');
const utils = require('./utils.js');
const walletUtils = require('./wallet-utils.js');

module.exports = async done => { 
  try {
    const accounts = await web3.eth.getAccounts();
    const walletFactory = await WalletFactory.deployed();

    //Deploy wallet and send eth to it
    const receipt = await walletFactory.deployCloneWallet(
      accounts[0],
      accounts[1],
      accounts[1],
    );
    const wallet = await CloneableWallet.at(receipt.receipt.logs[0].args.wallet);
    await web3.eth.sendTransaction({from: accounts[0], to: wallet.address, value: web3.utils.toWei('1')});

    //Send Eth transfer
    const [sender, recipient] = [accounts[1], accounts[2]];
    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(recipient));
    const amount = web3.utils.toWei('1');
    await walletUtils.transact0(
      walletUtils.txData(0, recipient, amount, Buffer.from('')),
      wallet,
      sender
    );
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(recipient));
    console.log(balanceAfter.sub(balanceBefore).toString());
  } catch(e) {
    console.log(e);
  }

  done();
}
