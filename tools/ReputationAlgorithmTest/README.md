# BrightByte resputation test
This project is created to test Reputation smartcontract precision.

 #### Run the project

- Install the dependencies by running yarn install.
- Configure `app.config.custom.ts` and `truffle-config.custom.js` with your Ethereum/Quorum node information.
- Ensure to have your node acount unlocked.
- Run `yarn run truffle:custom-deploy`.
- Run `node ./testOffchain.js` and `node ./testOnchain.js` in two terminal.
- Compare the results

