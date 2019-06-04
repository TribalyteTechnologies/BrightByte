var path = require("path");
var truffleCustomConfig = require("./truffle-config.custom");
module.exports = {

	contracts_build_directory: path.join(__dirname, "./src/assets/build"),
		networks: {
			development: {
				host: "localhost",
				port: 9545,
				network_id: "*", // Match any network id
				websockets: true    
			},
			custom: truffleCustomConfig,
		},
		compilers: 
		{
			solc: 
			{
			version: "0.4.21", // A version or constraint - Ex. "^0.5.0"
								// Can also be set to "native" to use a native solc
			}
		}
};
