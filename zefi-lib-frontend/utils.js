import Web3 from 'web3';
import ethUtils from 'ethereumjs-util';
import abi from 'ethereumjs-abi';
import BN from 'bn.js';

/**
 * Converts a number to a 32 byte padded hex encoded buffer
 * @param {number | string} num 
 * @returns {Buffer} buffer
 */
const numToBuffer = num => {
  return numToBufferWithN(num, 64);
};

const numToBufferWithN = (num, amt) => {
  return Buffer.from(
    new Web3.utils.BN(Web3.utils.toHex(num).replace('0x', ''), 16).toString(16, amt),
    "hex"
  ); // number
};

const funcHash = signature => {
  return(
    abi.soliditySHA3(["string"], [signature]).slice(0, 4)
  );
};

export default {
  numToBuffer,
  funcHash
};
