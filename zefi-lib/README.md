# ZeFi Lib

NodeJS client to interact with ZeFi smart contracts (factory & wallet) 

## Getting started

1. Start a local development with Ganache:

```
ganache-cli
```

2. In your code, instantiate web3 and require this package:


```
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const zefiLib = require('path/to/packageFolder');
```

Note that This package is not published on the npm registry. You need to have 
the `zefi-contracts` repo cloned on your filesystem and import it directly 
from there.

3. You can use all the functions exposed in `index.js`:

* createWalletFactory()
* createWallet()
* sendEther()
* sendERC20Token()

## Examples

You will find examples on how to use these functions in the `examples` folder.

## Backend / Frontend compatibility

This runs only on NodeJS. For frontend we will need to either create another
package or make that one isomorphic, using webpack and 2 compilation targets
for example.
