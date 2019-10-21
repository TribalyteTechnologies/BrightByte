import { MigrationService } from "./migration";

console.log("Migration Data Tool");
let migrationSrv = new MigrationService();
console.log("The migration proccess is ready to start");
migrationSrv.startMigration();