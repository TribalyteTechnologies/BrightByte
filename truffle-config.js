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
    	}
};
