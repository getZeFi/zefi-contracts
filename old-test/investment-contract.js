const StandardTokenMock = artifacts.require('Test/StandardTokenMock.sol');
const CDaiMock = artifacts.require('Test/CDaiMock.sol');
const YDaiMock = artifacts.require('Test/YDaiMock.sol');
const InvestmentContractV1 = artifacts.require('Investment/InvestmentContractV1.sol');
const InvestmentContractV2 = artifacts.require('Investment/InvestmentContractV2.sol');

contract('InvestmentContracts', accounts => {
  let dai, target, investmentContract, zefiLib;
  const [admin, zefiWalletAddress, walletAddress,] = accounts; 
  const initialDaiBalance = web3.utils.toBN(web3.utils.toWei('10')); 

  const setupContracts = async (InvestmentContract, TargetMock) => {
    dai = await StandardTokenMock.new(admin, web3.utils.toWei('100'));
    target = await TargetMock.new(dai.address); 
    investmentContract = await InvestmentContract.new(
      [dai.address], 
      [target.address], 
      zefiWalletAddress
    );
    await dai.transfer(walletAddress, initialDaiBalance); 
  };

  const runDepositWithdrawTest = async () => {
    const interest = initialDaiBalance.div(web3.utils.toBN(10));
    const fee = interest.div(web3.utils.toBN(10)); //10pct is deducted from interest
    let balance;

    await dai.approve(investmentContract.address, initialDaiBalance, {from: walletAddress}); 
    await investmentContract.depositAll({from: walletAddress});
    daiBalances = await Promise.all([
      dai.balanceOf(walletAddress),
      dai.balanceOf(target.address),
      dai.balanceOf(investmentContract.address)
    ]);
    assert(daiBalances[0].isZero());
    assert(daiBalances[1].eq(initialDaiBalance));
    assert(daiBalances[2].isZero());

    await dai.transfer(target.address, interest);

    await investmentContract.withdrawAll({from: walletAddress});
    daiBalances = await Promise.all([
      dai.balanceOf(walletAddress),
      dai.balanceOf(investmentContract.address),
      dai.balanceOf(zefiWalletAddress),
    ]);
    assert(daiBalances[0].eq(initialDaiBalance.add(interest).sub(fee)));
    assert(daiBalances[1].isZero());
    assert(daiBalances[2].eq(fee));
  };

  context('InvestmentContractV1', () => {
    beforeEach(async () => {
      await setupContracts(
        InvestmentContractV1,
        CDaiMock
      );
    });

    it('Deposit, withdraw sequence', async () => {
      await runDepositWithdrawTest();
    });
  });

  context('InvestmentContractV2', () => {
    beforeEach(async () => {
      await setupContracts(
        InvestmentContractV2,
        YDaiMock
      );
    });

    it('Deposit, withdraw sequence', async () => {
      await runDepositWithdrawTest();
    });
  });
});
