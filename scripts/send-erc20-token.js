const WalletFactory = artifacts.require("./WalletFactory/WalletFactory.sol");
const CloneableWallet = artifacts.require('./Wallet/CloneableWallet.sol');
const Token = artifacts.require('Test/StandardTokenMock.sol');
const utils = require('./utils.js');
const walletUtils = require('./wallet-utils.js');

module.exports = async done => { 
  try {
    const accounts = await web3.eth.getAccounts();
    const walletFactory = await WalletFactory.deployed();
    const token = await Token.new(accounts[1], web3.utils.toWei('10'));

    //Deploy wallet 
    const receipt = await walletFactory.deployCloneWallet(
      accounts[0],
      accounts[1],
      accounts[1],
    );
    const wallet = await CloneableWallet.at(receipt.receipt.logs[0].args.wallet);
    await token.transfer(wallet.address, web3.utils.toWei('1'), {from: accounts[1]});

    //prepare internal tx data
    const dataBuff = walletUtils.erc20Transfer(accounts[3], web3.utils.toWei('1'));

    //Send transaction
    await walletUtils.transact0(
      walletUtils.txData(0, token.address, 0, dataBuff), 
      wallet,
      accounts[1]
    );

    const balance = await token.balanceOf(accounts[3]);
    console.log(balance.toString());
  } catch(e) {
    console.log(e);
  }
  done();
}
