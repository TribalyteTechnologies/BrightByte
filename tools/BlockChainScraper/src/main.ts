import { CollectDataService } from "./collect-data.service";

console.log("Collect Data Tool");
let collectorSrv = new CollectDataService();
console.log("The collect proccess is ready to start");

collectorSrv.start();
