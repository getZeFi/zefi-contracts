const StandardTokenMock = artifacts.require('Test/StandardTokenMock.sol');
const CDaiMock = artifacts.require('Test/CDaiMock.sol');
const InvestmentContract = artifacts.require('Investment/InvestmentContractV1.sol');

contract('InvestmentContract', accounts => {
  let dai, cDai, investmentContract, zefiLib;
  const [admin, zefiWalletAddress, walletAddress,] = accounts; 
  const initialDaiBalance = web3.utils.toBN(web3.utils.toWei('10')); 
  
  beforeEach(async () => {
    dai = await StandardTokenMock.new(admin, web3.utils.toWei('100'));
    cDai = await CDaiMock.new(dai.address); 
    investmentContract = await InvestmentContract.new(
      [dai.address], 
      [cDai.address], 
      zefiWalletAddress
    );

    await dai.transfer(cDai.address, initialDaiBalance); 
    await dai.transfer(walletAddress, initialDaiBalance); 
  });

  it('should deposit and withdraw tokens from cDai', async () => {
    const interest = initialDaiBalance.div(web3.utils.toBN(10));
    const fee = interest.div(web3.utils.toBN(10)); //10pct is deducted from interest
    let balance;

    await dai.approve(investmentContract.address, initialDaiBalance, {from: walletAddress}); 
    await investmentContract.depositAll({from: walletAddress});
    daiBalances = await Promise.all([
      dai.balanceOf(walletAddress),
      dai.balanceOf(cDai.address),
      dai.balanceOf(investmentContract.address)
    ]);
    assert(daiBalances[0].isZero());
    assert(daiBalances[1].eq(initialDaiBalance.add(initialDaiBalance)));
    assert(daiBalances[2].isZero());

    await investmentContract.withdrawAll({from: walletAddress});
    daiBalances = await Promise.all([
      dai.balanceOf(walletAddress),
      dai.balanceOf(investmentContract.address),
      dai.balanceOf(zefiWalletAddress),
    ]);
    assert(daiBalances[0].eq(initialDaiBalance.add(interest).sub(fee)));
    assert(daiBalances[1].isZero());
    assert(daiBalances[2].eq(fee));
  });
});
