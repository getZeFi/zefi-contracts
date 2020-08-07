const { parseEther, randomBytes } = require('ethers').utils;
const EscrowManager = require("../build/EscrowManager");
const etherlime = require('etherlime-lib');

const ERC20 = require("../build/TestERC20");
const ETH_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const TestManager = require("../utils/test-manager");
const utilities = require('../utils/utilities.js');

describe("Escrow Manager", function () {
    this.timeout(1000000);

    const manager = new TestManager();

    let infrastructure = accounts[0].signer;
    let owner = accounts[1].signer;
    let receiver = accounts[2].signer;

    let wallet, escrow, token;

    before(async () => {
        deployer = manager.newDeployer();
        // deploy token
        token = await deployer.deploy(ERC20, {}, [infrastructure.address, owner.address], 10000000, 18);
        escrow = await deployer.deploy(
            EscrowManager,
            {}
        );
    });

    describe("Escrow for ETH", () => {
        
        it('should create ETH payment', async () => {
            let paymentTokenHash = utilities.createHash(randomBytes(32), owner.address)
        
            const params = [paymentTokenHash];
            tx = await escrow.from(owner).createETHPayment(...params, { value: 10000000, gasLimit: 4000000 });
            txReceipt = await escrow.verboseWaitForTransaction(tx);

            assert.isTrue(await utils.hasEvent(txReceipt, escrow, "ETHTokenPaymentCreated"), "should have generated ETHTokenPaymentCreated event");

            const payment = await escrow.payments(paymentTokenHash);
            assert.equal(payment.from, owner.address, "From should be the owner address");
            assert.equal(payment.value.toString(), '10000000', "Value should be 1 ETH");
            assert(payment.sent === false, "Payment should not be sent yet");
        });

        it('should send token if paymentToken is correct', async () => {
            const paymentToken = randomBytes(32)
            let paymentTokenHash = utilities.createHash(paymentToken, owner.address)
        
            const params = [paymentTokenHash];
            tx = await escrow.from(owner).createETHPayment(...params, { value: 10000000, gasLimit: 4000000 });
            txReceipt = await escrow.verboseWaitForTransaction(tx);

            assert.isTrue(await utils.hasEvent(txReceipt, escrow, "ETHTokenPaymentCreated"), "should have generated ETHTokenPaymentCreated event");

            const payment = await escrow.payments(paymentTokenHash);
            assert.equal(payment.from, owner.address, "From should be the owner address");
            assert.equal(payment.value.toString(), '10000000', "Value should be 1 ETH");
            assert(payment.sent === false, "Payment should not be sent yet");

            const params2 = [paymentToken, receiver.address];
            tx = await escrow.from(owner).sendPayment(...params2, { gasLimit: 4000000 });
            txReceipt = await escrow.verboseWaitForTransaction(tx);

            assert.isTrue(await utils.hasEvent(txReceipt, escrow, "ETHSendPaymentExecuted"), "should have generated ETHSendPaymentExecuted event");
        });

    });

    describe("Escrow for ERC20", () => {

        it('should create ERC20 token payment', async () => {
            const paymentToken = randomBytes(32)
            let paymentTokenHash = utilities.createHash(paymentToken, owner.address)
            let amount = parseEther('1')
            
            const tokenParams = [escrow.contractAddress, amount];
            let approveTx = await token.from(owner).approve(...tokenParams, { gasLimit: 4000000 });
            approveTxReceipt = await token.verboseWaitForTransaction(approveTx);
            assert.isTrue(await utils.hasEvent(approveTxReceipt, token, "Approval"), "should have approved ERC20 tokens against escrow");
            
            const params = [amount, paymentTokenHash, token.contractAddress];
            tx = await escrow.from(owner).createTokenPayment(...params, { gasLimit: 4000000 });
            txReceipt = await escrow.verboseWaitForTransaction(tx);

            assert.isTrue(await utils.hasEvent(txReceipt, escrow, "ERC20TokenPaymentCreated"), "should have generated ERC20TokenPaymentCreated event");
            const payment = await escrow.payments(paymentTokenHash);
            assert.equal(payment.from, owner.address, "From should be the owner address");
            assert.equal(payment.value.toString(), '1000000000000000000', "Value should be 10000 ERC20 tokens");
            assert.equal(payment.token, token.contractAddress, "Token should have ERC20 address");
            assert(payment.sent === false, "Payment should not be sent yet");
        });

        it('should send ERC20 token if paymentToken is correct', async () => {
            const paymentToken = randomBytes(32)
            let paymentTokenHash = utilities.createHash(paymentToken, owner.address)

            let amount = parseEther('1')
            
            const tokenParams = [escrow.contractAddress, amount];
            let approveTx = await token.from(owner).approve(...tokenParams, { gasLimit: 4000000 });
            approveTxReceipt = await token.verboseWaitForTransaction(approveTx);
            assert.isTrue(await utils.hasEvent(approveTxReceipt, token, "Approval"), "should have approved ERC20 tokens against escrow");
            
            const params = [amount, paymentTokenHash, token.contractAddress];
            tx = await escrow.from(owner).createTokenPayment(...params, { gasLimit: 4000000 });
            txReceipt = await escrow.verboseWaitForTransaction(tx);

            assert.isTrue(await utils.hasEvent(txReceipt, escrow, "ERC20TokenPaymentCreated"), "should have generated ERC20TokenPaymentCreated event");
            const payment = await escrow.payments(paymentTokenHash);
            assert.equal(payment.from, owner.address, "From should be the owner address");
            assert.equal(payment.value.toString(), '1000000000000000000', "Value should be 10000 ERC20 tokens");
            assert.equal(payment.token, token.contractAddress, "Token should have ERC20 address");
            assert(payment.sent === false, "Payment should not be sent yet");

            const sendPaymentParams = [paymentToken, receiver.address];
            let txSendPayment = await escrow.from(owner).sendPayment(...sendPaymentParams, { gasLimit: 4000000 });
            let txSendPaymentReceipt = await escrow.verboseWaitForTransaction(txSendPayment);

            assert.isTrue(await utils.hasEvent(txSendPaymentReceipt, escrow, "ERC20SendPaymentExecuted"), "should have generated ERC20SendPaymentExecuted event");
        });

        it('should NOT send token if paymentToken is incorrect or already sent', async () => {
            const paymentToken = randomBytes(32)
            let paymentTokenHash = utilities.createHash(paymentToken, owner.address)

            let amount = parseEther('1')
            
            const tokenParams = [escrow.contractAddress, amount];
            let approveTx = await token.from(owner).approve(...tokenParams, { gasLimit: 4000000 });
            approveTxReceipt = await token.verboseWaitForTransaction(approveTx);
            assert.isTrue(await utils.hasEvent(approveTxReceipt, token, "Approval"), "should have approved ERC20 tokens against escrow");
            
            const params = [amount, paymentTokenHash, token.contractAddress];
            tx = await escrow.from(owner).createTokenPayment(...params, { gasLimit: 4000000 });
            txReceipt = await escrow.verboseWaitForTransaction(tx);

            assert.isTrue(await utils.hasEvent(txReceipt, escrow, "ERC20TokenPaymentCreated"), "should have generated ERC20TokenPaymentCreated event");
            const payment = await escrow.payments(paymentTokenHash);
            assert.equal(payment.from, owner.address, "From should be the owner address");
            assert.equal(payment.value.toString(), '1000000000000000000', "Value should be 10000 ERC20 tokens");
            assert.equal(payment.token, token.contractAddress, "Token should have ERC20 address");
            assert(payment.sent === false, "Payment should not be sent yet");

            const sendPaymentParams = [randomBytes(32), receiver.address];
            await assert.revert(escrow.from(owner).sendPayment(...sendPaymentParams, { gasLimit: 4000000 }), "should fail when incorrect token is passed.");
        });

    });
});