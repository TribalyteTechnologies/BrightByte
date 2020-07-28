const fs = require("fs");
const CONTRACT_ABI_PATH = "./build/contracts/";
const CONTRACT_INFO_PATH = "./migrations/ContractsInfo.json";

function updateContractAddress(contractName, contractInfo) {
    const fileName = contractName + ".json"
    const filePath = CONTRACT_ABI_PATH + fileName;
    const contractData = fs.readFileSync(filePath, { encoding: "utf8" });
    let contractContent = JSON.parse(contractData);
    contractContent.networks[contractInfo.netId].address = contractInfo.address;
    fs.writeFileSync(filePath, JSON.stringify(contractContent));
    console.log("Updated address for contract: ", fileName, contractInfo.address);
}

const data = fs.readFileSync(CONTRACT_INFO_PATH, { encoding: "utf8" });
const contractsInfo = JSON.parse(data);
Object.keys(contractsInfo).forEach(contractName => {
    updateContractAddress(contractName, contractsInfo[contractName]);
});
