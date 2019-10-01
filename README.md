# BrightByte
This is the BrightByte developer reputation project.

## Folder organization
This project is divided in several folders.

 - /webapp contains the frontend project developed with Ionic 3.
 - /backend contains the backend project developed with NestJS.
 - /tools contains useful scripts for testing or code examples.

 Each one of them contains its own package.json with several commands and dependecies. Some of them also contains a README.md file with more information.

## Dependencies installation
Run `npm install` in each directory for installing all the dependencies.

 #### Migrations:
 
Each change of version where the smart contracts have been modified will be necessary to do a migration in order to
keep the data. For more information about Migrations please see [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/webapp/MIGRATIONS.md)

 #### Terms and conditions
This project comes with a default terms and conditions text. This text can be modified by adding HTML in the file `src/pages/termsandconditions/termsandconditions.html` or in `src/assets/i18n/[language].json` to the variable `app.termsDescrition`.

 #### More information

For more information about BrightByte please visit our [blog post about BrightByte](https://tech.tribalyte.eu/blog-lanzamiento-brightbyte-v0-4) (in Spanish) or contact [Tribalyte Technologies](http://tribalyte.com).

Licensed under the conditions of `LICENSE.md`.

Trophy icons designed by Freepik from Flaticon

Identicon generator is powered by [DiceBear Avatars](https://avatars.dicebear.com).

