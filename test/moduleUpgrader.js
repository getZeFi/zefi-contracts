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
    })
});
