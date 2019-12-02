# BrightByte webapp
This is the BrightByte webapp project.

 #### The following commands are available:

- Install the dependencies by running npm install.
- Run the local network npm run truffle:develop.
- To deploy the smart contracts to the blockchain: npm run truffle:migrate.
- To run the frontend locally npm start.
- Create a user account with the "Register" button of BrightByte.
- Add balance to the user accounts using Metamask or the truffle-develop command line, as follows:
- Change the truffle-config.js and the app.configh.ts with your own blockchain network.
- Get the address of an automatically generated truffle-develop wallet (e.g. 0x627306090abab3a6e1400e9345bc60c78a8bef57)
- Get the address of the generated BrightByte account ("address" field in "Identity.json") (e.g. 0xaaa1d134ad26de2636acdbb2fd6e524ea7ad551a)
- Send funds from the former to the latter with "sendTransaction", like for example: web3.eth.sendTransaction({from: "0x627306090abab3a6e1400e9345bc60c78a8bef57", to: "0xaaa1d134ad26de2636acdbb2fd6e524ea7ad551a", value: web3.toWei("5", "ether")})
- In order to initialize the backend, it's necessary to run "npm install" in "/backend".
- To run the backend locally, use "npm run start" in "/backend". 
- See `package.json` for more npm scripts.

 #### In order to deploy the application to a server:

1. Configure "app.config.custom.ts" and "truffle-config.custom.js" with your Ethereum/Quorum node information.
2. Set `IS_CUSTOM_NET` to `true` in "app.config.ts".
3. Run `ACCOUNT_PASSWORD=node_account_pass npm run truffle:custom-deploy`.
4. Run `npm run build-browser-release`.
5. Upload the directory `platforms/browser/www/` to your web server.
6. Open the URL pointing to your web server.

#### Other config variables

Since BrightByte v0.5.6+ there is feature that requires the users to have a minimum number of commits and reviews to be qualified to be present on the season ranking.
This changes part of the ranking style and hides reputation for non-ranked users. To config this feature:
1. Go to `src/app.config.ts` edit the variable `FIRST_QUALIFYING_SEASON` and set it to the first season on which qualifying feature will be available. If you want to disable this feature set it to -1.
2. Go to `src/app.config.ts` edit the variables `MIN_REVIEW_QUALIFY` and `MIN_COMMIT_QUALIFY` to the minimum number of reviews and commits needed to be qualified.

