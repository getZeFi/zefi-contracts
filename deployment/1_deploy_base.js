const BaseWallet = require('../build/BaseWallet');
const ModuleRegistry = require('../build/ModuleRegistry');
const CompoundRegistry = require('../build/CompoundRegistry');
const MultiSig = require('../build/ZefiMultiSigWallet');
const WalletFactory = require('../build/ZefiWalletFactory');

const utils = require('../utils/utilities.js');

const DeployManager = require('../utils/deploy-manager.js');
const MultisigExecutor = require('../utils/multisigexecutor.js');


const deploy = async (network, secret) => {
    const manager = new DeployManager(network);
    await manager.setup();

    const configurator = manager.configurator;
    const deployer = manager.deployer;
    const abiUploader = manager.abiUploader;

    const newConfig = configurator.config;
    const prevConfig = configurator.copyConfig();
    console.log('Previous Config:', prevConfig);

    const deploymentWallet = deployer.signer;
    const deploymentAccount = await deploymentWallet.getAddress();

    // Deploy the Base Wallet Library
    const BaseWalletWrapper = await deployer.deploy(BaseWallet);
    // Deploy the MultiSig
    const MultiSigWrapper = await deployer.deploy(MultiSig, {}, newConfig.multisig.threshold, newConfig.multisig.owners);

    // Deploy Module Registry
    const ModuleRegistryWrapper = await deployer.deploy(ModuleRegistry);
    // Deploy Compound Registry
    const CompoundRegistryWrapper = await deployer.deploy(CompoundRegistry);

    // Deploy the Wallet Factory
    const WalletFactoryWrapper = await deployer.deploy(WalletFactory, {}, ModuleRegistryWrapper.contractAddress, BaseWalletWrapper.contractAddress);

    ///////////////////////////////////////////////////
    // Add token to the Compound Registry
    ///////////////////////////////////////////////////
    
    for (let underlying in newConfig.defi.compound.markets) {
        const cToken = newConfig.defi.compound.markets[underlying];
        const addUnderlyingTransaction = await CompoundRegistryWrapper.addCToken(underlying, cToken);
        await CompoundRegistryWrapper.verboseWaitForTransaction(addUnderlyingTransaction, `Adding unerlying ${underlying} with cToken ${cToken} to the registry`);
    }

    configurator.updateInfrastructureAddresses({
        ZefiMultiSigWallet: MultiSigWrapper.contractAddress,
        WalletFactory: WalletFactoryWrapper.contractAddress,
        ModuleRegistry: ModuleRegistryWrapper.contractAddress,
        CompoundRegistry: CompoundRegistryWrapper.contractAddress,
        BaseWallet: BaseWalletWrapper.contractAddress
    });
    await configurator.save();

    await Promise.all([
        abiUploader.upload(MultiSigWrapper, "contracts"),
        abiUploader.upload(WalletFactoryWrapper, "contracts"),
        abiUploader.upload(ModuleRegistryWrapper, "contracts"),
        abiUploader.upload(CompoundRegistryWrapper, "contracts"),
        abiUploader.upload(BaseWalletWrapper, "contracts")
    ]);
};

module.exports = {
    deploy
};
