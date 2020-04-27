import Web3 from 'web3';
import ZefiLib from 'zefiLib';

const web3 = new Web3('http://localhost:8545');
const zefiLib = ZefiLib(web3);

const init = async () => {
  const accounts = await web3.eth.getAccounts();
  const walletFactoryAddress = await zefiLib.createWalletFactory({
    from: accounts[0]
  });
  const walletAddress = await zefiLib.createWallet({
    from: accounts[0],
    recoveryAddress: accounts[0], 
    authorizedAddress: accounts[1], 
    cosignerAddress: accounts[1],
    walletFactoryAddress
  });

  //const etherAmount = ? 
  //const from = ?
  //const to = ?
  //await zefiLib.sendEther({
  //  from,  //authorizedAddress of wallet
  //  to,
  //  amount: etherAmount, 
  //  walletAddress
  //});
  //return;

  //const tokenAddress = ?
  //const tokenAmount = ?
  //await zefiLib.sendERC20Token({
  //  from, //authorizedAddress of wallet
  //  to,
  //  amount: tokenAmount,
  //  walletAddress,
  //  tokenAddress
  //});
}

/**
 * Before running this you need to:
 * - deploy an erc20 token
 * - call
 * update the tokenAddress 
 * send some ether and erc20 token to the wallet
 */
init();
