const { expectRevert } = require('@openzeppelin/test-helpers');
const Escrow = artifacts.require('Escrow.sol');
const StandardTokenMock = artifacts.require('Test/StandardTokenMock.sol');

const createHash = v => {
  return web3.utils.soliditySha3({
    t: 'bytes32',
    v 
  });
}

contract('Escrow', (accounts) => {
  let escrow, token;

  const createPaymentParams = () => {
    const paymentParams = {
      from: accounts[0], 
      to: accounts[1], 
      value: web3.utils.toWei('1'),
      tokenAddress: token.address,
      paymentToken: web3.utils.randomHex(32) 
    };
    const paymentTokenHash = createHash(paymentParams.paymentToken); 
    return { ...paymentParams, paymentTokenHash };
  };

  beforeEach(async () => {
    escrow = await Escrow.new();
    token = await StandardTokenMock.new(accounts[0], web3.utils.toWei('100'));
  });

  it('should create ETH payment', async () => {
    const paymentParams = createPaymentParams();

    await escrow.createEthPayment(
      paymentParams.paymentTokenHash,
      {value: paymentParams.value} 
    );

    const payment = await escrow.payments(paymentParams.paymentTokenHash);
    assert(payment.from === paymentParams.from); 
    assert(payment.value.toString() === paymentParams.value); 
    assert(payment.sent === false);
  });

  it('should create token transfer', async () => {
    const paymentParams = createPaymentParams();

    await token.approve(escrow.address, paymentParams.value);
    await escrow.createTokenPayment(
      paymentParams.paymentTokenHash,
      paymentParams.value,
      paymentParams.tokenAddress
    );

    const payment = await escrow.payments(paymentParams.paymentTokenHash);
    assert(payment.from === paymentParams.from); 
    assert(payment.value.toString() === paymentParams.value); 
    assert(payment.token === paymentParams.tokenAddress); 
    assert(payment.sent === false);
  });

  it('should send token if paymentToken is correct', async () => {
    const paymentParams = createPaymentParams();

    await token.approve(escrow.address, paymentParams.value);
    await escrow.createTokenPayment(
      paymentParams.paymentTokenHash,
      paymentParams.value,
      paymentParams.tokenAddress
    );
    await escrow.sendPayment(paymentParams.paymentToken, paymentParams.to);

    const [payment, balance] = await Promise.all([
      escrow.payments(paymentParams.paymentTokenHash),
      token.balanceOf(paymentParams.to)
    ]);
    assert(payment.from === paymentParams.from); 
    assert(payment.value.toString() === paymentParams.value); 
    assert(payment.token === paymentParams.tokenAddress); 
    assert(payment.sent === true);
    assert(balance.toString() === paymentParams.value);
  });

  it('should NOT send token if paymentToken is incorrect or already sent', async () => {
    const paymentParams = createPaymentParams();
    const wrongPaymentToken = web3.utils.randomHex(32); 

    await token.approve(escrow.address, paymentParams.value);
    await escrow.createTokenPayment(
      paymentParams.paymentTokenHash,
      paymentParams.value,
      paymentParams.tokenAddress
    );
    await expectRevert(
      escrow.sendPayment(wrongPaymentToken, paymentParams.to),
      'wrong _paymentToken'
    );
    await escrow.sendPayment(paymentParams.paymentToken, paymentParams.to),
    await expectRevert(
      escrow.sendPayment(paymentParams.paymentToken, paymentParams.to),
      'payment already sent'
    );
  });
});
