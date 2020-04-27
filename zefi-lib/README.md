# ZeFi Lib

Client library to interact with ZeFi smart contracts. Work both in nodeJS and in browsers.

## Getting started

(for local development make sure to follow the readme at the root of this repo for deploying smart contracts)

1. Download the code

```
git clone https://github.com/getZeFi/zefi-contracts
```

2. Installation

In the package.json of your project, add manually a file dependency to this project:

```
...
"dependencies": {
  "zefiLib": "file:path/to/zefi-lib-folder"
},
...
```

You will also need to have web3 installed:

```
npm install web3
```

3. In your code, import the library

Usage in frontend:

```
import ZefiLib from "zefiLib";
```

Usage in NodeJS:

```
const zefiLib = require("zefiLib").default;
```

4. Instantiate the library

```
import Web3 from 'web3';
const web3 = new Web3('http://localhost:8545');
const zefiLib = ZefiLib(web3);
```

5. Now you can use it

```
//zefiLib.createWalletFactory()
//zefiLib.createWallet()
//zefiLib.sendEther()
//zefiLib.sendERC20Token()
//see in zefi-lib/src/index.js for arguments
```
