const etherlime = require('etherlime-lib');
const Wallet = require("../build/BaseWallet");
const OnlyOwnerModule = require("../build/TestOnlyOwnerModule");
const Module = require("../build/TestModule");
const SimpleUpgrader = require("../build/SimpleUpgrader");
const Registry = require("../build/ModuleRegistry");

const TestManager = require("../utils/test-manager");

const { keccak256, toUtf8Bytes } = require('ethers').utils

describe("Test ModuleUpgrader", function () {
    this.timeout(10000);

    const manager = new TestManager();

    let owner = accounts[1].signer;
    let registry;

    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(accounts[0].secretKey);
        registry = await deployer.deploy(Registry);
    });

    describe("Registering modules", () => {
        it("should register modules in the registry", async () => {
            let name = "test_1.1";
            let module = await deployer.deploy(Module, {}, registry.contractAddress);
            await registry.registerModule(module.contractAddress, ethers.utils.formatBytes32String(name));
            let isRegistered = await registry.isRegisteredModule(module.contractAddress);
            assert.equal(isRegistered, true, "module1 should be registered");
            let info = await registry.moduleInfo(module.contractAddress);
            assert.equal(ethers.utils.parseBytes32String(info), name, "module1 should be registered with the correct name");
        });

        it("should add registered modules to a wallet", async () => {
            // create modules
            let initialModule = await deployer.deploy(Module, {}, registry.contractAddress);
            let moduleToAdd = await deployer.deploy(Module, {}, registry.contractAddress);
            // register module
            await registry.registerModule(initialModule.contractAddress, ethers.utils.formatBytes32String("initial"));
            await registry.registerModule(moduleToAdd.contractAddress, ethers.utils.formatBytes32String("added"));
            // create wallet with initial module
            let wallet = await deployer.deploy(Wallet);

            await wallet.init(owner.address, [initialModule.contractAddress]);
            let isAuthorised = await wallet.authorised(initialModule.contractAddress);
            assert.equal(isAuthorised, true, "initial module should be authorised");
            // add module to wallet
            await initialModule.from(owner).addModule(wallet.contractAddress, moduleToAdd.contractAddress, { gasLimit: 1000000 });
            isAuthorised = await wallet.authorised(moduleToAdd.contractAddress);
            assert.equal(isAuthorised, true, "added module should be authorised");
        });

        it("should block addition of unregistered modules to a wallet", async () => {
            // create modules
            let initialModule = await deployer.deploy(Module, {}, registry.contractAddress);
            let moduleToAdd = await deployer.deploy(Module, {}, registry.contractAddress);
            // register initial module only
            await registry.registerModule(initialModule.contractAddress, ethers.utils.formatBytes32String("initial"));
            // create wallet with initial module
            let wallet = await deployer.deploy(Wallet);
            await wallet.init(owner.address, [initialModule.contractAddress]);
            let isAuthorised = await wallet.authorised(initialModule.contractAddress);
            assert.equal(isAuthorised, true, "initial module should be authorised");
            // try (and fail) to add moduleToAdd to wallet
            await assert.revert(initialModule.from(owner).addModule(wallet.contractAddress, moduleToAdd.contractAddress, { gasLimit: 1000000 }));
            isAuthorised = await wallet.authorised(moduleToAdd.contractAddress);
            assert.equal(isAuthorised, false, "unregistered module should not be authorised");
        });
    })
});
