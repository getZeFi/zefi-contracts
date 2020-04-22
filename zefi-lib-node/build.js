//extract abi and bytecode into their own file in contracts folder
const path = require('path');
const fs = require('fs');
const { spawnSync, spawn } = require('child_process');

const contracts = [
  '../build/contracts/WalletFactory.json', 
  '../build/contracts/CloneableWallet.json' 
];

const truffle = spawn('truffle', ['build'], {cwd: path.join(__dirname, '../')});
truffle.stdout.on('data', data => {
  console.log(data.toString());
});
truffle.stdout.on('close', data => {
  contracts.forEach(contract => {
    const contractConfPath = path.join(__dirname, 'contracts', contract.split('/').slice(-1)[0]);
    spawnSync('rm', [contractConfPath]); 
    const contractFile = JSON.parse(
      fs.readFileSync(path.join(__dirname, contract), 'utf8')
    );
    const contractConf = JSON.stringify({
      abi: contractFile.abi, 
      bytecode: contractFile.bytecode
    });
    fs.writeFileSync(contractConfPath, contractConf, 'utf8'); 
  });
});
