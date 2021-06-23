require("@nomiclabs/hardhat-ethers");
//require('solidity-coverage');
const walletUtils = require("./walletUtils");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

const fs = require('fs');
const infuraKey = fs.readFileSync(".infura").toString().trim();

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  mocha: {
    timeout: 500000
  },
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings:{
          evmVersion: "istanbul",
          optimizer: { enabled: true, runs: 200 }
        }
      }
    ]
  },
  networks:{
    coverage: {
      url: 'http://localhost:8555'
    },
    hardhat:{
      allowUnlimitedContractSize:false,
      gas: 6000000,
      accounts:walletUtils.localWallet("1000000000000000000000000",num=20),
      forking : {
        url:`https://mainnet.infura.io/v3/${infuraKey}`
      // url:`https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`
      }
    },
    matic: {
      url:"https://matic-mainnet.chainstacklabs.com",
      accounts:walletUtils.makeKeyList(),
      chainId: 137,
      gasPrice: 10000000000
    }
  }
};
