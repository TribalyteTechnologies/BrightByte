# BrightByte
This is the BrightByte developer reputation project.

Trophy icons designed by Freepik from Flaticon

Identicon generator is powered by the Identicon PHP library

The following commands are available:

- Install the dependencies by running npm install.
- Comment line 27 of ./node_modules/truffle-contract/contract.js.
- Run the local network npm run truffle:develop.
- To deploy the smart contracts to the blockchain: npm run truffle:migrate.
- To run the frontend locally npm start.
- Create a user account with the "Register" button of BrightByte.
- Add balance to the user accounts using Metamask or the truffle-develop command line, as follows:
- Change the truffle-config.js and the app.configh.ts with your own blockchain network.
- Get the address of an automatically generated truffle-develop wallet (e.g. 0x627306090abab3a6e1400e9345bc60c78a8bef57)
- Get the address of the generated BrightByte account ("address" field in "Identity.json") (e.g. 0xaaa1d134ad26de2636acdbb2fd6e524ea7ad551a)
- Send funds from the former to the latter with "sendTransaction", like for example: web3.eth.sendTransaction({from: "0x627306090abab3a6e1400e9345bc60c78a8bef57", to: "0xaaa1d134ad26de2636acdbb2fd6e524ea7ad551a", value: web3.toWei("5", "ether")})
- See package.json for more npm scripts.

For more information please contact [Tribalyte Technologies](http://tribalyte.com).

Licensed under the conditions of `LICENSE.md`.

