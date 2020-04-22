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

  const etherAmount = 1000;
  await zefiLib.sendEther({
    sender, //authorizedAddress of wallet
    recipient,
    amount: etherAmount, 
    walletAddress
  });

  const tokenAddress = '0x478e7AeF57d7f951933dbabe0c17Cf751F0b1f55';
  const tokenAmount = 1000;
  await zefiLib.sendERC20Token({
    sender, //authorizedAddress of wallet
    recipient,
    amount: tokenAmount,
    walletAddress,
    tokenAddress
  });
}

/**
 * Before running this script you need to:
 * deploy an erc20 token
 * update the tokenAddress
 * send some ether and erc20 token to the wallet
 */
//init();
