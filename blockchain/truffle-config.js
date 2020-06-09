var path = require("path");
var truffleCustomConfig = require("./truffle-config.custom.js");
var PrivateKeyProvider = require("@truffle/hdwallet-provider");

const BESU_PROVIDER = "http://localhost:8545";
const BESU_PRIVATE_KEY = "0x0000000000000000000000000000000000000000000000000000000000000000";


var besuPrivateKeyProvider = new PrivateKeyProvider(BESU_PRIVATE_KEY, BESU_PROVIDER);


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: 5777,
    },
    custom: truffleCustomConfig,
    besu: {
      provider: besuPrivateKeyProvider,
      network_id: "*",
      gasPrice: 0,
      gas: 20000000
    }
  },

  plugins: ["solidity-coverage"],

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.4.22"
    }
  }
}
