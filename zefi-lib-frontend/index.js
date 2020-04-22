import CloneableWalletConf from './contracts/CloneableWallet.json';
import WalletFactoryConf from './contracts/WalletFactory.json';
import walletUtils from './wallet-utils.js';

const init = web3 => {
  const CloneableWallet = new web3.eth.Contract(CloneableWalletConf.abi);
  const WalletFactory = new web3.eth.Contract(WalletFactoryConf.abi);

  /**
   * Create new wallet factory, configured to point to a CloneableWallet
   * returns address of wallet factory
   */
  const createWalletFactory = async ({ from }) => { 
    const cloneableWallet = await CloneableWallet
      .deploy({
        data: CloneableWalletConf.bytecode
      })
      .send({ from, gas: 3771957 });
    const walletFactory = await WalletFactory
      .deploy({
        data: WalletFactoryConf.bytecode, 
        arguments: [cloneableWallet.options.address]
      })
      .send({ from, gas: 3537759 });
    return walletFactory.options.address;
  }

  /**
   * Creates new wallet, using WalletFactory
   * returns address of new wallet
   */
  const createWallet = async ({
    from,
    recoveryAddress, 
    authorizedAddress, 
    cosignerAddress,
    walletFactoryAddress
  }) => { 
    const walletFactory = new web3.eth.Contract(
      WalletFactoryConf.abi, 
      walletFactoryAddress
    );
    const receipt = await walletFactory.methods.deployCloneWallet(
      recoveryAddress,
      authorizedAddress,
      cosignerAddress
    )
    .send({ from, gas: 135500 });
    return receipt.events.WalletCreated.returnValues.wallet;
  }

  /**
   * send Ether from a wallet
   */
  const sendEther = async ({sender, recipient, amount, walletAddress}) => {
    const wallet = new web3.eth.Contract(CloneableWalletConf.abi, walletAddress);
    await walletUtils.transact0(
      walletUtils.txData(0, recipient, amount, Buffer.from('')),
      wallet,
      sender
    );
    return;
  }

  /**
   * send ERC20 from a wallet
   */
  const sendERC20Token = async ({sender, recipient, amount, walletAddress, tokenAddress}) => {
    const wallet = new web3.eth.Contract(CloneableWalletConf.abi, walletAddress);
    const dataBuff = walletUtils.erc20Transfer(recipient, amount);
    await walletUtils.transact0(
      walletUtils.txData(0, tokenAddress, 0, dataBuff), 
      wallet,
      sender
    );
  }

  return {
    createWalletFactory,
    createWallet,
    sendEther,
    sendERC20Token
  };
}

export default init;
