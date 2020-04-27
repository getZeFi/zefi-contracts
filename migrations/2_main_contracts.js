const StandardTokenMock = artifacts.require('Test/StandardTokenMock.sol');
const CDaiMock = artifacts.require('Test/CDaiMock.sol');
const InvestmentContract = artifacts.require('Investment/InvestmentContractV1.sol');
const WalletFactory = artifacts.require('WalletFactory/WalletFactory.sol');
const CloneableWallet = artifacts.require('./Wallet/CloneableWallet.sol');

module.exports = async function (deployer, accounts, network) {
  const [adminAddress, zefiWalletAddress, senderAddress,] = accounts; 
  const initialDaiBalance = web3.utils.toBN(web3.utils.toWei('10')); 
  let dai, cDai, investmentContract, walletFactory;

  if(network === 'development') {
    //Deploy dai, cDai and investment contract
    dai = await StandardTokenMock.new(adminAddress, web3.utils.toWei('100'));
    cDai = await CDaiMock.new(dai.address); 
    await dai.transfer(cDai.address, initialDaiBalance); 
    investmentContract = await InvestmentContract.new(
      [dai.address], 
      [cDai.address], 
      zefiWalletAddress
    );

    //Deploy wallet factory
    await deployer.deploy(CloneableWallet);
    await deployer.deploy(WalletFactory, CloneableWallet.address);
    walletFactory = await WalletFactory.deployed();
    await walletFactory.updateInvestmentContract(investmentContract.address);
  }
};
