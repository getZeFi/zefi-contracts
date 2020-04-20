const crypto = require('crypto');
const ethUtils = require('ethereumjs-util');
const BN = require('bn.js');
const Web3 = require('web3');
const abi = require('ethereumjs-abi');

const newKeyPair = () => {
  const private = crypto.randomBytes(32);
  const address = `0x${ethUtils.privateToAddress(private).toString('hex')}`;
  return {
    address: web3.utils.toChecksumAddress(address),
    private
  };
};

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

module.exports = {
  newKeyPair,
  numToBuffer,
  funcHash
};
