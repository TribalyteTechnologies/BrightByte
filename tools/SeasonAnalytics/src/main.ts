import { CollectDataService } from "./collect-data.service";
import { TransformDataService } from "./transfor-data.service";
import { UserDataCsv } from "./season-analytics.model";

const allData = "allData.csv";
const lastSeason = "lastSeason.csv";

let usersCsv = new Array<UserDataCsv>();
const transformDataService = new TransformDataService();


console.log("Collect Data Tool");
let collectorSrv = new CollectDataService();
console.log("The collect proccess is ready to start");

collectorSrv.startCollection().then(res => {
    return collectorSrv.getUsersData();
}).then(users => {
    usersCsv = new Array<UserDataCsv>();
    users.forEach(user => {
        user.seasonData.forEach((seasonData, index) => {
            let userCsv = new UserDataCsv();
            userCsv.email = user.email;
            userCsv.hash = user.hash;
            userCsv.name = user.name;
            userCsv.stats = seasonData.seasonStats;
            userCsv.stats.reputation = userCsv.stats.reputation;
            userCsv.from += (" " + index);
            usersCsv.push(userCsv);
        });
    });
    transformDataService.newFile(usersCsv, allData);
    const lastSeasonData = usersCsv.filter(user => user.from === "Season 3");
    transformDataService.newFile(lastSeasonData, lastSeason);
    console.log("Finished the proccess of writing analytics");
});
