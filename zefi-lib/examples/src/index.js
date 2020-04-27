import Web3 from 'web3';
import ZefiLib from 'zefiLib';

const web3 = new Web3('http://localhost:8545');
const zefiLib = ZefiLib(web3);

const init = async () => {
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
init();
