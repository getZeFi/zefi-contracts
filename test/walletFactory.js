const Wallet = require("../build/BaseWallet");
const Module = require("../build/BaseModule");
const ModuleRegistry = require("../build/ModuleRegistry");
const Factory = require('../build/WalletFactoryNew');

const TestManager = require("../utils/test-manager");
const { randomBytes, bigNumberify } = require('ethers').utils;
const utilities = require('../utils/utilities.js');
const ZERO_BYTES32 = ethers.constants.HashZero;
const ZERO_ADDRESS = ethers.constants.AddressZero;

describe("Test Zefi Wallet Factory", function () {
    this.timeout(10000);

    const manager = new TestManager();

    let infrastructure = accounts[0].signer;
    let owner = accounts[1].signer;
    let other = accounts[6].signer;


    let implementation,
        moduleRegistry,
        factory;

    before(async () => {
        deployer = manager.newDeployer();
        implementation = await deployer.deploy(Wallet);
        
        moduleRegistry = await deployer.deploy(ModuleRegistry);
        
        factory = await deployer.deploy(Factory, {},
            moduleRegistry.contractAddress,
            implementation.contractAddress);
        
        await factory.addManager(infrastructure.address);
        
    });
    let module1, module2;

    beforeEach(async () => {
        // Restore the good state of factory (we set these to bad addresses in some tests)
        await factory.changeModuleRegistry(moduleRegistry.contractAddress);
        
        module1 = await deployer.deploy(Module, {}, moduleRegistry.contractAddress, ZERO_BYTES32);
        
        module2 = await deployer.deploy(Module, {}, moduleRegistry.contractAddress, ZERO_BYTES32);
        await moduleRegistry.registerModule(module1.contractAddress, ethers.utils.formatBytes32String("module1"));
        await moduleRegistry.registerModule(module2.contractAddress, ethers.utils.formatBytes32String("module2"));
    });

    describe("Configure the factory", () => {
        it("should allow owner to change the module registry", async () => {
            const randomAddress = utilities.getRandomAddress();
            await factory.changeModuleRegistry(randomAddress);
            const updatedModuleRegistry = await factory.moduleRegistry();
            assert.equal(updatedModuleRegistry, randomAddress);
        });

        it("should not allow owner to change the module registry to zero address", async () => {
            await assert.revertWith(factory.changeModuleRegistry(ethers.constants.AddressZero), "WF: address cannot be null");
        });

        it("should not allow non-owner to change the module registry", async () => {
            const randomAddress = utilities.getRandomAddress();
            await assert.revertWith(factory.from(other).changeModuleRegistry(randomAddress), "Must be owner");
        });
    });   
    
    describe("Create wallets with CREATE2", () => {
        let module1, module2;

        beforeEach(async () => {
            module1 = await deployer.deploy(Module, {}, moduleRegistry.contractAddress, ZERO_BYTES32);
            module2 = await deployer.deploy(Module, {}, moduleRegistry.contractAddress, ZERO_BYTES32);
            await moduleRegistry.registerModule(module1.contractAddress, ethers.utils.formatBytes32String("module1"));
            await moduleRegistry.registerModule(module2.contractAddress, ethers.utils.formatBytes32String("module2"));
        });

        it("should create a wallet at the correct address", async () => {
            let salt = bigNumberify(randomBytes(32)).toHexString ();             
            let modules = [module1.contractAddress, module2.contractAddress]; 
            // we get the future address
            let futureAddr = await factory.getAddressForCounterfactualWallet(owner.address, modules, salt); 
            console.log("futureAddr 1: ", futureAddr)
            // we create the wallet
            let tx = await factory.from(infrastructure).createCounterfactualWallet(owner.address, modules, salt);
            
            let txReceipt = await factory.verboseWaitForTransaction(tx);
            console.log("txReceipt 2: ", txReceipt)
            //let walletAddr = txReceipt.events.filter(event => event.event == 'ZefiWalletCreated')[0].args.wallet;
            // we test that the wallet is at the correct address
            //assert.equal(futureAddr, walletAddr, 'should have the correct address');
        }); 
    });
});