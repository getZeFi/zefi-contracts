const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const zefiLib = require('../index.js')(web3);

const init = async () => {
  const accounts = await web3.eth.getAccounts();
  const walletFactoryAddress = await zefiLib.createWalletFactory({
    from: accounts[0]
  });
}

init();

