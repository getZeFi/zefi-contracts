const WalletFactory = artifacts.require("./WalletFactory/WalletFactory.sol");
const CloneableWallet = artifacts.require('./Wallet/CloneableWallet.sol');
const Storage = artifacts.require('Test/Storage.sol');
const utils = require('./utils.js');
const walletUtils = require('./wallet-utils.js');

module.exports = async done => { 
  try {
    const accounts = await web3.eth.getAccounts();
    const walletFactory = await WalletFactory.deployed();
    const storage = await Storage.new();

    //Deploy wallet 
    const receipt = await walletFactory.deployCloneWallet(
      accounts[0],
      accounts[1],
      accounts[1],
    );
    const wallet = await CloneableWallet.at(receipt.receipt.logs[0].args.wallet);

    //prepare internal tx data
    const dataArr = [];
    dataArr.push(utils.funcHash('set(uint256)'));
    dataArr.push(utils.numToBuffer(11));
    const dataBuff = Buffer.concat(dataArr);

    //Send transaction
    await walletUtils.transact0(
      walletUtils.txData(0, storage.address, 0, dataBuff), 
      wallet,
      accounts[1]
    );

    const dataVal = await storage.data();
    console.log(dataVal.toString());
  } catch(e) {
    console.log(e);
  }
  done();
}
