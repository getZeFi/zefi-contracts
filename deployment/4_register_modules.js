const ModuleRegistry = require('../build/ModuleRegistry');
const MultiSig = require('../build/ZefiMultiSigWallet');

const ZefiTransfer = require('../build/ZefiTransfer');
const CompoundManager = require('../build/Compound');

const utils = require('../utils/utilities.js');

const DeployManager = require('../utils/deploy-manager.js');
const MultisigExecutor = require('../utils/multisigexecutor.js');

const deploy = async (network, secret) => {

    ////////////////////////////////////
    // Setup
    ////////////////////////////////////

    const manager = new DeployManager(network);
    await manager.setup();

    const configurator = manager.configurator;
    const deployer = manager.deployer;
    const versionUploader = manager.versionUploader;

    const deploymentWallet = deployer.signer;

    const config = configurator.config;

    const TransferManagerWrapper = await deployer.wrapDeployedContract(ZefiTransfer, config.modules.ZefiTransfer);
    const CompoundManagerWrapper = await deployer.wrapDeployedContract(CompoundManager, config.modules.Compound);

    const ModuleRegistryWrapper = await deployer.wrapDeployedContract(ModuleRegistry, config.contracts.ModuleRegistry);
    const MultiSigWrapper = await deployer.wrapDeployedContract(MultiSig, config.contracts.ZefiMultiSigWallet);

    const wrappers = [
        TransferManagerWrapper,
        CompoundManagerWrapper
    ];

    ////////////////////////////////////
    // Register modules
    ////////////////////////////////////

    const multisigExecutor = new MultisigExecutor(MultiSigWrapper, deploymentWallet, config.multisig.autosign);

    for (let idx = 0; idx < wrappers.length; idx++) {
        let wrapper = wrappers[idx];
        await multisigExecutor.executeCall(ModuleRegistryWrapper, "registerModule", [wrapper.contractAddress, utils.asciiToBytes32(wrapper._contract.contractName)]);
    }

    ////////////////////////////////////
    // Upload Version
    ////////////////////////////////////

    const modules = wrappers.map((wrapper) => {
        return { address: wrapper.contractAddress, name: wrapper._contract.contractName };
    });
    const version = {
        modules: modules,
        fingerprint: utils.versionFingerprint(modules),
        version: "1.0.0",
        createdAt: Math.floor((new Date()).getTime() / 1000)
    }
    await versionUploader.upload(version);
};

module.exports = {
    deploy
};