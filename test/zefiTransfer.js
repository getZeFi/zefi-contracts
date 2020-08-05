/* global accounts, utils */
const ethers = require("ethers");
const chai = require("chai");
const BN = require("bn.js");
const bnChai = require("bn-chai");

const { expect } = chai;
chai.use(bnChai(BN));

const Proxy = require("../build/Proxy");
const BaseWallet = require("../build/BaseWallet");
const Registry = require("../build/ModuleRegistry");
const GuardianStorage = require("../build/GuardianStorage");
const ZefiTransfer = require("../build/ZefiTransfer");
const ERC20 = require("../build/TestERC20");
const TestContract = require('../build/TestContract');

const { ETH_TOKEN } = require("../utils/utilities.js");

const ETH_LIMIT = 1000000;
const ZERO_BYTES32 = ethers.constants.HashZero;

const ACTION_TRANSFER = 0;

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
    let transferModule;
    let wallet;
    let walletImplementation;
    let erc20;
    let weth;

    before(async () => {
        deployer = manager.newDeployer();
        registry = await deployer.deploy(Registry);

        guardianStorage = await deployer.deploy(GuardianStorage);

        transferModule = await deployer.deploy(ZefiTransfer, {},
            registry.contractAddress,
            guardianStorage.contractAddress);
      
        await registry.registerModule(transferModule.contractAddress, ethers.utils.formatBytes32String("ZefiTransfer"));
        walletImplementation = await deployer.deploy(BaseWallet);
    });

    beforeEach(async () => {
        const proxy = await deployer.deploy(Proxy, {}, walletImplementation.contractAddress);
        wallet = deployer.wrapDeployedContract(BaseWallet, proxy.contractAddress);
        await wallet.init(owner.address, [transferModule.contractAddress]);
    
        const decimals = 12; // number of decimal for TOKN contract
        
    });

});
