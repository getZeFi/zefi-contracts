const ModuleRegistry = require('../build/ModuleRegistry');
const WalletFactory = require('../build/ZefiWalletFactory');
const CompoundRegistry = require('../build/CompoundRegistry');

const DeployManager = require('../utils/deploy-manager.js');

const deploy = async (network, secret) => {

    const manager = new DeployManager(network);
    await manager.setup();

    const configurator = manager.configurator;
    const deployer = manager.deployer;

    const config = configurator.config;

    const WalletFactoryWrapper = await deployer.wrapDeployedContract(WalletFactory, config.contracts.WalletFactory);
    const ModuleRegistryWrapper = await deployer.wrapDeployedContract(ModuleRegistry, config.contracts.ModuleRegistry);
    const CompoundRegistryWrapper = await deployer.wrapDeployedContract(CompoundRegistry, config.contracts.CompoundRegistry);
    
    for (idx in config.backend.accounts) {
        let account = config.backend.accounts[idx];
        const WalletFactoryAddManagerTx = await WalletFactoryWrapper.contract.addManager(account);
        await WalletFactoryWrapper.verboseWaitForTransaction(WalletFactoryAddManagerTx, `Set ${account} as the manager of the ZefiWalletFactory`);
    }

    ////////////////////////////////////
    // Set contracts' owners
    ////////////////////////////////////

    const wrappers = [WalletFactoryWrapper, ModuleRegistryWrapper, CompoundRegistryWrapper];
    for (let idx = 0; idx < wrappers.length; idx++) {
        let wrapper = wrappers[idx];
        const changeOwnerTx = await wrapper.contract.changeOwner(config.contracts.ZefiMultiSigWallet);
        await wrapper.verboseWaitForTransaction(changeOwnerTx, `Set the MultiSig as the owner of ${wrapper._contract.contractName}`);
    }
};

module.exports = {
    deploy
};