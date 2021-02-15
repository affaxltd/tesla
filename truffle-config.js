const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

const env = process.env;

module.exports = {
  networks: {
    fork: {
      host: "127.0.0.1",
      port: 8545,
      gas: 2500000,
      gasPrice: 75000000000,
      network_id: 1,
    },
    kovan: {
      provider: () => new HDWalletProvider(env.MEMO, env.KINFURA),
      gas: 2500000,
      gasPrice: 7000000000,
      network_id: 42,
    },
    mainnet: {
      provider: () => new HDWalletProvider(env.MEMO, env.INFURA),
      network_id: 1,
    },
  },
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: env.ETHERSCAN_API,
  },
};
