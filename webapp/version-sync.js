var parser = require("xml2json");
var fs = require('fs');
var currentVersion = require("../version.json").version;

fs.readFile('./config.xml', (err, data) => {
    var json = JSON.parse(parser.toJson(data));
    json.widget.version = currentVersion;
    var xml = parser.toXml(json);
    fs.writeFile("./config.xml", xml, err => {
        if(!err) {
            console.log("Version sync succesfull");
        } else {
            console.log("An error has happened on version sync: " + err);
            throw err;
        } 
    });
});
