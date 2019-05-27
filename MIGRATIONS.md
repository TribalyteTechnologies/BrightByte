# Migrations Procedures

#### From v 0.3.6 to v 0.4.0

One user can do the migration of all the data.
Now the variables related to a season, in what season we want to start and the initial Timestamp of our own Brightbyte, are not hard coded. They are initializedwhen the new contracts are deployed, changing the varibles `INITIAL_SEASON_INDEX` and `INITIAL_SEASON_TIMESTAMP` on `migrations/2_deploy_contracts.js`.

1. Access to the source `src/assets/build` of the old version.
2. Rename the files `Bright.json`, `Commits.json` and `Root.json` by adding Old, for example, `BrightOld.json`.
3. Change the constant variable `MIGRATION_END_TIMESTAMP` of Bright and Commits smart contracts to viable Unix Timestamp, that will allow us to use the super set functions during the period that the migration lasts.
4. Deploy the new version with: `npm run truffle:migrate`. 
5. Copy the previous files and paste them to the source `src/assets/build` of the new version.
6. Run the frontend: `npm start`.
7. Load the user's json file and enter the password.
8. Click in the migration button.

#### From v 0.3.2 to v 0.3.3

One user can do the migration of all the data.
This migration is different from the rest, because it is a migration between different networks. We need two different networks configuration a source and a destination one.

1. Add a source network configuration to the file `src/app.config.custom.ts`, this indicates the origin of the data.
2. Add a posting network configuration to the file `src/app.config.custom.ts`, this indicates the destination of the data.
3. Access to the source `src/assets/build` of the old version.
4. Rename the files `Bright.json`, `Commits.json` and `Root.json` by adding Old, for example, `BrightOld.json`.
5. Change the constant variable `MIGRATION_END_TIMESTAMP` of Bright and Commits smart contracts to viable Unix Timestamp, that will allow us to use the super set functions during the period that the migration lasts.
6. Deploy the new version with: `npm run truffle:migrate`. 
7. Copy the previous files and paste them to the source `src/assets/build` of the new version.
8. Run the frontend: `npm start`.
9. Load the user's json file and enter the password.
10. Click in the migration button.


#### From v 0.2.1 to v 0.3.0

One user can do the migration of all the data.

1. Access to the source `src/assets/build` of the old version.
2. Rename the file `Bright.json` by adding Old, for example, `BrightOld.json`.
3. Change the constant variable `finalDayMigrate` of Bright and Commits smart contracts to viable Unix Timestamp, that will allow us to use the super set functions during the period that the migration lasts.
4. Deploy the new version with: `npm run truffle:migrate`. 
5. Copy the previous files and paste them to the source `src/assets/build` of the new version.
6. Run the frontend: `npm start`.
7. Load the user's json file and enter the password.
8. Click in the migration button.

#### From v 0.2.0 to v 0.2.1

Each user has to do the migration of his own data.

1. Access to the source `src/assets/build` of the old version.
2. Rename the files `Bright.json`, `Commits.json` and `Root.json` by adding Old, for example, `BrightOld.json`.
3. Change the constant variable `finalDayMigrate` of Bright and Commits smart contracts to viable Unix Timestamp, that will allow us to use the super set functions during the period that the migration lasts.
5. Deploy the new version with: `npm run truffle:migrate`. 
5. Copy the previous files and paste them to the source `src/assets/build` of the new version.
6. Run the frontend: `npm start`.
7. Load the user's json file that you want to migrate and enter the password.
8. Click in the migration button.
