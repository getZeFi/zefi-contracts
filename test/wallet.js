const StandardTokenMock = artifacts.require('Test/StandardTokenMock.sol');
const CDaiMock = artifacts.require('Test/CDaiMock.sol');
const InvestmentContract = artifacts.require('InvestmentContract.sol');
const WalletFactory = artifacts.require('WalletFactory/WalletFactory.sol');
const Wallet = artifacts.require('Wallet/CloneableWallet.sol');
const ZefiLib = require('zefiLib').default;

contract('Wallet', accounts => {
  let dai, cDai;
  let walletFactory, wallet, investmentContract, zefiLib;
  let walletFactoryAddress, walletAddress;
  const [adminAddress, zefiWalletAddress, senderAddress, recipientAddress,] = accounts; 
  const initialDaiBalance = web3.utils.toBN(web3.utils.toWei('10')); 
  
  beforeEach(async () => {
    //Deploy dai, cDai and investment contract
    dai = await StandardTokenMock.new(adminAddress, web3.utils.toWei('100'));
    cDai = await CDaiMock.new(dai.address); 
    await dai.transfer(cDai.address, initialDaiBalance); 
    investmentContract = await InvestmentContract.new(
      [dai.address], 
      [cDai.address], 
      zefiWalletAddress
    );

    //Deploy WalletFactory
    zefiLib = ZefiLib(web3);
    walletFactoryAddress = await zefiLib.createWalletFactory({from: adminAddress});
    walletFactory = await WalletFactory.at(walletFactoryAddress);
    await walletFactory.updateInvestmentContract(investmentContract.address);

    //Deploy wallet
    walletAddress = await zefiLib.createWallet({
      from: adminAddress, 
      recoveryAddress: adminAddress, 
      authorizedAddress: senderAddress, 
      cosignerAddress: senderAddress,
      walletFactoryAddress
    });
    await dai.transfer(walletAddress, initialDaiBalance); 
    await web3.eth.sendTransaction({
      from: senderAddress, 
      to: walletAddress, 
      value: web3.utils.toWei('1')
    });

    //Simulate the service that will regularly send token to investment contract 
    wallet = await Wallet.at(walletAddress);
    await wallet.depositToInvestmentContract({from: senderAddress});
  });

  it('Integration - Ether transfer', async () => {
    const etherAmount = web3.utils.toBN(web3.utils.toWei('1'));
    const interest = initialDaiBalance.div(web3.utils.toBN(10));
    const fee = interest.div(web3.utils.toBN(10));
    let balance;

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(recipientAddress));
    await zefiLib.sendEther({
      from: senderAddress,
      to: recipientAddress,
      amount: etherAmount, 
      walletAddress
    });
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(recipientAddress));
    daiBalances = await Promise.all([
      dai.balanceOf(walletAddress),
      dai.balanceOf(investmentContract.address),
      dai.balanceOf(zefiWalletAddress),
      dai.balanceOf(cDai.address),
      wallet.balanceOf()
    ]);
    assert(balanceAfter.sub(balanceBefore).eq(etherAmount));
    assert(daiBalances[0].isZero()),
    assert(daiBalances[1].isZero());
    assert(daiBalances[2].eq(fee));
    assert(daiBalances[3].eq(
      initialDaiBalance
      .add(initialDaiBalance)
      .sub(fee)
    ));
    
    //dai was invested twice, in the beforeEach() hook
    //and when we run sendEther() above
    const balance1 = initialDaiBalance
      .add(interest)
      .sub(fee);
    const interest2 = balance1.div(web3.utils.toBN(10));
    const fee2 = interest2.div(web3.utils.toBN(10));
    const balance2 = balance1
      .add(interest2)
      .sub(fee2);
    assert(daiBalances[4][0].eq(balance2));
  });
});
