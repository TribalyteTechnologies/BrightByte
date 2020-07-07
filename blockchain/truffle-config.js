var truffleCustomConfig = require("./truffle-config.custom.js");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: 5777,
    },
    custom: truffleCustomConfig,
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
