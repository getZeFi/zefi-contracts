const StandardTokenMock = artifacts.require('Test/StandardTokenMock.sol');
const CDaiMock = artifacts.require('Test/CDaiMock.sol');
const InvestmentContract = artifacts.require('InvestmentContract.sol');

contract('InvestmentContract', accounts => {
  let dai, cDai, investmentContract, zefiLib;
  const [admin, wallet, zefiWallet] = [accounts[0], accounts[1], accounts[2]];
  const initialDaiBalance = web3.utils.toBN(web3.utils.toWei('10')); 
  
  beforeEach(async () => {
    dai = await StandardTokenMock.new(admin, web3.utils.toWei('100'));
    cDai = await CDaiMock.new(dai.address); 
    investmentContract = await InvestmentContract.new(
      dai.address, 
      cDai.address, 
      zefiWallet
    );

    await dai.transfer(cDai.address, initialDaiBalance); 
    await dai.transfer(wallet, initialDaiBalance); 
  });

  it('should deposit and withdraw tokens from cDai', async () => {
    const amount = web3.utils.toBN(web3.utils.toWei('1'));
    const interest = amount.div(web3.utils.toBN(10));
    const fee = interest.div(web3.utils.toBN(10));
    let balance;

    await dai.approve(investmentContract.address, amount, {from: wallet}); 
    await investmentContract.deposit(amount, {from: wallet});
    daiBalances = await Promise.all([
      dai.balanceOf(wallet),
      dai.balanceOf(cDai.address),
      dai.balanceOf(investmentContract.address)
    ]);
    assert(daiBalances[0].eq(initialDaiBalance.sub(amount)));
    assert(daiBalances[1].eq(initialDaiBalance.add(amount)));
    assert(daiBalances[2].isZero());

    await investmentContract.withdraw({from: wallet});
    daiBalances = await Promise.all([
      dai.balanceOf(wallet),
      dai.balanceOf(investmentContract.address),
      dai.balanceOf(zefiWallet),
    ]);
    assert(daiBalances[0].eq(initialDaiBalance.add(interest).sub(fee)));
    assert(daiBalances[1].isZero());
    assert(daiBalances[2].eq(fee));
  });
});
