import * as fs from 'fs';

export class FileWriteService {

    public writeToFile(path: string, data: string) {
        fs.writeFile(path, data, function (err) {
            if (err) {
                console.error("Error writting to file: " + err);
            }
        });
        console.log(path + " file created");
    }
}
