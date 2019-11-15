const converter = require("json-2-csv");
import * as fs from "fs";

export class TransformDataService {
    public constructor() { }

    public newFile(data: any, fileName: string) {
        console.log("A new file is going to be writen with the name: " + fileName);
        return converter.json2csv(data, (err, csv) => {
            if (err) throw err;
            fs.writeFile(fileName, csv, "utf8", function (err) {
                if (err) {
                    console.log("Some error occured - file either not saved or corrupted file saved.");
                } else {
                    console.log("Its saved!");
                }
            });
        });
    }
}
