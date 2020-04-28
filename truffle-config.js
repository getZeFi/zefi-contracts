
var HDWalletProvider = require("truffle-hdwallet-provider");

// idbravemac16 wallet's seed phrase
const MNEMONIC = 'release exist stove life clock veteran coral tape rally danger other town'

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://rinkeby.infura.io/v3/741ef88b1e1d4a4d97268a379983c9f9")
      },
      network_id: '*',
      gas: 4000000      //make sure this gas allocation isn't over 4M, which is the max
    }
  },
  compilers: {
    solc: {
      version: "0.5.10",
    }
  }
};
