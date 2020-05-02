# ZeFi Smart Contracts

Smart contracts and client libraries for ZeFi

## Getting started

1. Install NodeJS, Ganache and Truffle: 

```
npm install -g ganache-cli truffle
```

2. Clone this repo:

```
git clone https://github.com/getZeFi/zefi-contracts
```

3. Install dependencies:

```
npm install
```

4. Start Ganache (local development Blockchain):

```
ganache-cli
```

5. Deploy smart contracts

```
npm run deploy
```

The addresses of the deployed contracts can be found in the json files in  `build/contracts`

## Running tests

First, make sure that you are running Ganache:

```
ganache-cli
```

In another terminal, run:

```
npm run test
```

This will run the tests inside the test folder.


## Smart contracts

Main contracts

* WalletFactory.sol: The factory that deploys new wallets
* CoreWallet.sol: that's where we have the core of the logic  
* InvestmentContract.sol: This allow to invest and withdraw from Compound

Other contracts

* CDaiMock: mock of Compound cDai
* StandardTokenMock: mock of ERC20 tokens


