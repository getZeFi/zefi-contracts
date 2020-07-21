const Wallet = require('../build/BaseWallet');
const TestModule = require('../build/TestModule');
const Registry = require('../build/ModuleRegistry');

const TestManager = require("../utils/test-manager");

describe("Test BaseWallet", function () {
    const manager = new TestManager();

    let owner = accounts[1].signer;
    let nonowner = accounts[2].signer;

    let wallet;
    let newModule;

    before(async () => {
        deployer = manager.newDeployer();
        const registry = await deployer.deploy(Registry);
        newModule = await deployer.deploy(TestModule, {}, registry.contractAddress);
    });

    beforeEach(async () => {
        wallet = await deployer.deploy(Wallet);
    });

    describe("New BaseWallet", () => {
        it("should work with new modules", async () => {
            await wallet.init(owner.address, [newModule.contractAddress]);
            await newModule.callDapp(wallet.contractAddress);
            await newModule.callDapp2(wallet.contractAddress, 2, true);
        })

        it("should bubble the reason message up when reverting", async () => {
            await wallet.init(owner.address, [newModule.contractAddress]);
            const reason = "I'm hereby reverting this transaction using a reason message that is longer than 32 bytes!"
            try {
                await newModule.fail(wallet.contractAddress, reason);
            } catch (e) {
                assert.isTrue(await manager.isRevertReason(e, reason), "invalid reason message");
            }

        })
        
    });
});