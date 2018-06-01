var path = require('path');
module.exports = {
//contracts_build_directory: "./src/assets/build",
contracts_build_directory: path.join(__dirname, "./src/assets/build"),
  networks: {
    development: {
      host: "localhost",
      port: 9545,
      network_id: "*", // Match any network id
      //from: "0x627306090abab3a6e1400e9345bc60c78a8bef57"
      websockets: true    
    },
  tribalyte: {
      host: "52.209.188.78",
      port: 22000,
      network_id: "*",
      gasPrice: 0,
      gas: 2000000,
      from: "0x6EB1E76B3B4002EaEfB07619DA0447d8954D2f99"
    },
  }
};
//NO FUNCIONA
//ACCOUNT_PASSWORD=Passw0rd darq-truffle migrate --network tribalyte --reset

//SI FUNCIONA
//ACCOUNT_PASSWORD=Passw0rd truffle migrate --network tribalyte --reset
