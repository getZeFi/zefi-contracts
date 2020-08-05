/* global accounts, utils */
const ethers = require("ethers");
const chai = require("chai");
const BN = require("bn.js");
const bnChai = require("bn-chai");

const { expect } = chai;
chai.use(bnChai(BN));

const Proxy = require("../build/Proxy");
const Wallet = require("../build/BaseWallet");
const Registry = require("../build/ModuleRegistry");
const GuardianStorage = require("../build/GuardianStorage");
const ZefiTransfer = require("../build/ZefiTransfer");
const ERC20 = require("../build/TestERC20");
const TestContract = require('../build/TestContract');

const ETH_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const DECIMALS = 12;
const ZERO_BYTES32 = ethers.constants.HashZero;

const TestManager = require("../utils/test-manager");

describe("TransferManager", function () {
    this.timeout(10000);
  
    const manager = new TestManager();
  
    const infrastructure = accounts[0].signer;
    const owner = accounts[1].signer;
    const nonowner = accounts[2].signer;
    const recipient = accounts[3].signer;
    const spender = accounts[4].signer;

    let deployer;
    let registry;
    let guardianStorage;
    let zefiTransfer;
    let wallet;
    let walletImplementation;
    let erc20;
    let weth;

    before(async () => {
        deployer = manager.newDeployer();
        registry = await deployer.deploy(Registry);
        guardianStorage = await deployer.deploy(GuardianStorage);

        zefiTransfer = await deployer.deploy(ZefiTransfer, {},
            registry.contractAddress,
            guardianStorage.contractAddress
        );
        await registry.registerModule(zefiTransfer.contractAddress, ethers.utils.formatBytes32String("ZefiTransfer"));
    });

    beforeEach(async () => {
        wallet = await deployer.deploy(Wallet);
        await wallet.init(owner.address, [zefiTransfer.contractAddress]);
        erc20 = await deployer.deploy(ERC20, {}, [infrastructure.address, wallet.contractAddress], 10000000, DECIMALS);
        await infrastructure.sendTransaction({ to: wallet.contractAddress, value: ethers.utils.bigNumberify('1000000000000000000') });
    });

    describe("ETH and ERC20 transfers", () => {
        async function transfer({ token, signer = owner, to, amount }) {
            let fundsBefore = (token == ETH_TOKEN ? await deployer.provider.getBalance(to.address) : await token.balanceOf(to.address));
            const params = [wallet.contractAddress, token == ETH_TOKEN ? ETH_TOKEN : token.contractAddress, to.address, amount, ZERO_BYTES32];
            const tx = await zefiTransfer.from(signer).transferToken(...params);
            let txReceipt = await zefiTransfer.verboseWaitForTransaction(tx);
            assert.isTrue(await utils.hasEvent(txReceipt, zefiTransfer, "Transfer"), "should have generated Transfer event");

            let fundsAfter = (token == ETH_TOKEN ? await deployer.provider.getBalance(to.address) : await token.balanceOf(to.address));
            assert.equal(fundsAfter.sub(fundsBefore).toNumber(), amount, 'should have transfered amount');
            return txReceipt;
        }

        it('should let the owner send ETH', async () => {
            await transfer({ token: ETH_TOKEN, to: recipient, amount: 10000 });
        });

        it('should let the owner send ERC20', async () => {
            await transfer({ token: erc20, to: recipient, amount: 10 });
        });
    });

    describe("ERC20 Token Approvals", () => {
        async function approve({ signer = owner, amount }) {
            const params = [wallet.contractAddress, erc20.contractAddress, spender.address, amount];
            let txReceipt;
            const tx = await zefiTransfer.from(signer).approveToken(...params);
            txReceipt = await zefiTransfer.verboseWaitForTransaction(tx);
            assert.isTrue(await utils.hasEvent(txReceipt, zefiTransfer, "Approved"), "should have generated Approved event");
        }

        it('should appprove an ERC20', async () => {
            await approve({ amount: 10 });
        });

        it('should not appprove an ERC20 transfer when the signer is not the owner ', async () => {
            try {
                await approve({ signer: nonowner, amount: 10 });
            } catch (error) {
                assert.ok(await manager.isRevertReason(error, "must be an owner"));
            }
        });
    });

});
