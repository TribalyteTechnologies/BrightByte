# BrightByte
This is the BrightByte developer reputation project.

## Branch distribution
In this repository there are two different implementations for brighbyte, a simple mono-team platform called, "base Brightbyte" marked with the tags vX.X.X and a multi-team version for called "Brightbyte cloud" uploaded to the master branch and marked with the tags vX.X.X-cloud.

Brightbyte cloud is built on top of base BrightByte adding all the team managing features.

## Folder organization
This project is divided in several folders.

 - /webapp contains the frontend project developed with Ionic 3.
 - /backend contains the backend project developed with NestJS.
 - /blockchain contains smartcontracts, deploying algorithms and some tests.
 - /tools contains useful scripts for testing or code examples.

 Each one of them contains its own package.json with several commands and dependecies. Some of them also contains a README.md file with more information.

## Quick local starup
Run `yarn install` then `yarn start` in root directory to install and start a full local version of Brightbyte.

## Startup order
If you want to customize the code an run it by yourself, there is a specific order to start the system:

1. Start ganache locally if needed with `yarn run ganache` in blockchain folder.
2. Deploy smartcontracts with `yarn run truffle:migrate`.
3. Go to webapp folder and run `yarn start` to run the frontend.
4. Finally go to backend folder and run `yarn start`.

## Dependencies installation
Run `yarn install` in each directory for installing all the dependencies.

 #### Migrations:
 
Each change of version where the smart contracts have been modified will be necessary to do a migration in order to
keep the data. For more information about Migrations please see [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/webapp/MIGRATIONS.md)

 #### Integration with version control systems

Since version v0.6.0 it is available a new optional feature that allows the users to use their favorites systems for version control, for more information about how to apply this feature please check it [here](https://github.com/TribalyteTechnologies/BrightByte/blob/master/backend/README.md) 


 #### Terms and conditions
This project comes with a default terms and conditions text. This text can be modified by adding HTML in the file `src/pages/termsandconditions/termsandconditions.html` or in `src/assets/i18n/[language].json` to the variable `app.termsDescrition`.

 #### More information

For more information about BrightByte please visit [BrightByte page](http://brightbyteapp.com/) or contact [Tribalyte Technologies](http://tribalyte.com).

Licensed under the conditions of `LICENSE.md`.

Trophy icons designed by Freepik from Flaticon

Identicon generator is powered by [DiceBear Avatars](https://avatars.dicebear.com).

