const GuardianStorage = require('../build/GuardianStorage');

const TransferManager = require('../build/ZefiTransfer');
const CompoundManager = require('../build/Compound');

const DeployManager = require('../utils/deploy-manager.js');

const deploy = async (network, secret) => {

    ////////////////////////////////////
    // Setup
    ////////////////////////////////////

    const manager = new DeployManager(network);
    await manager.setup();

    const configurator = manager.configurator;
    const deployer = manager.deployer;
    const abiUploader = manager.abiUploader;

    const config = configurator.config;

    const GuardianStorageWrapper = await deployer.deploy(GuardianStorage);
    
    // Deploy the ZefiTransfer module
    const TransferManagerWrapper = await deployer.deploy(
        TransferManager,
        {},
        config.contracts.ModuleRegistry,
        config.modules.GuardianStorage
    );
    
    // Deploy the CompoundManager module
    const CompoundManagerWrapper = await deployer.deploy(
        CompoundManager,
        {},
        config.contracts.ModuleRegistry,
        config.modules.GuardianStorage,
        config.defi.compound.comptroller,
        config.contracts.CompoundRegistry
    );
    

    ///////////////////////////////////////////////////
    // Update config and Upload ABIs
    ///////////////////////////////////////////////////

    configurator.updateModuleAddresses({
        GuardianStorage: GuardianStorageWrapper.contractAddress,
        ZefiTransfer: TransferManagerWrapper.contractAddress,
        Compound: CompoundManagerWrapper.contractAddress
    });

    const gitHash = require('child_process').execSync('git rev-parse HEAD').toString('utf8').replace(/\n$/, '');
    configurator.updateGitHash(gitHash);

    await configurator.save();

    await Promise.all([
        abiUploader.upload(GuardianStorageWrapper, "modules"),
        abiUploader.upload(TransferManagerWrapper, "modules"),
        abiUploader.upload(CompoundManagerWrapper, "modules")
    ]);

    console.log('Config:', config);
};

module.exports = {
    deploy
};