let onChainTest = async () => {
    const Web3 = require('web3');
    const TruffleContract = require('truffle-contract');
    const contractAbi = require('./build/contracts/Reputation.json');
    const config = require("./truffle-config.js");
    const network = config.networks.development;

    var web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    const contractAddress = contractAbi.networks[network.network_id].address;

    var truffleContract;
    var contract;
    var account = await web3.eth.getAccounts();
    account = account[0];
    truffleContract = TruffleContract(contractAbi);
    contract = new web3.eth.Contract(contractAbi.abi, contractAddress, {
        from: account,
        data: truffleContract.deployedBytecode
    });

    let commit1 = [[400, 200, 300]];
    let commit2 = [[500, 100, 300], [500, 100, 300]];
    let commit3 = [[500, 100, 300], [500, 100, 300]];
    let commit4 = [[500, 100, 300], [500, 100, 300]];
    let commit5 = [[500, 200, 300], [500, 200, 200]];
    let commit6 = [[400, 200, 300], [500, 200, 200]];
    let commit7 = [[400, 200, 300], [500, 200, 200]];
    let commit8 = [[500, 200, 300], [500, 200, 200]];
    let commit9 = [[500, 100, 300], [500, 100, 200], [300, 100, 300]];
    let commit10 = [[500, 200, 100], [500, 100, 300], [500, 100, 300]];
    let commit11 = [[500, 100, 100], [500, 200, 300], [500, 100, 300], [500, 200, 200]];
    let commit12 = [[500, 100, 100], [300, 100, 100], [500, 100, 300], [500, 100, 200]];
    let commit13 = [[500, 300, 100], [500, 200, 200], [400, 200, 300], [500, 200, 200]];
    let commit14 = [[500, 200, 100], [500, 200, 300], [500, 300, 300], [500, 200, 200]];
    let commit15 = [[500, 200, 100], [500, 200, 300], [400, 100, 300], [500, 200, 200]];
    let commit16 = [[500, 200, 100], [400, 200, 300], [400, 300, 300], [500, 300, 200]];
    let commit17 = [[500, 100, 300], [500, 100, 300]];
    let commit18 = [[500, 300, 100], [500, 200, 200], [500, 100, 300], [500, 100, 200]];
    let commit19 = [[500, 200, 300], [500, 300, 100], [400, 100, 300]];
    let commit20 = [[500, 100, 100], [500, 100, 300], [500, 100, 300]];
    let commit21 = [[500, 200, 300], [500, 200, 300]];
    let commit22 = [[400, 200, 200], [500, 200, 300], [500, 200, 200]];
    let commit23 = [[400, 200, 300], [500, 200, 300]];

    let reviews = [commit1, commit2, commit3, commit4, commit5, commit6, commit7, commit8, commit9, commit10, commit11, commit12,
        commit13, commit14, commit15, commit16, commit17, commit18, commit19, commit20, commit21, commit22, commit23];

    let finalReputation = 0;
    let cumulativePonderation = 0;

    for (let i = 0; i < reviews.length; i++) {

        let prevScore = 0;
        let prevComplexity = 0;

        let commit = [];
        for (let j = 0; j < reviews[i].length; j++) {

            let currentScore = 0;
            let currentComplexity = 0;

            commit.push(reviews[i][j]);

            let commitPonderation = 0;

            let cleanliness = [];
            let complexity = [];
            let revKnowledge = [];

            if (commit.length === 1) {
                cleanliness = [commit[0][0]];
                complexity = [commit[0][1]];
                revKnowledge = [commit[0][2]];
            } else {
                for (let w = 0; w < commit.length; w++) {
                    cleanliness.push(commit[w][0]);
                    complexity.push(commit[w][1]);
                    revKnowledge.push(commit[w][2]);
                }
            }

            commitPonderation = await contract.methods.calculateCommitPonderation(cleanliness, complexity, revKnowledge).call();


            currentScore = commitPonderation[0];
            currentComplexity = commitPonderation[1];

            let globalReputation = await contract.methods.calculateUserReputation(finalReputation, cumulativePonderation, currentScore, currentComplexity, prevScore, prevComplexity).call();


            finalReputation = globalReputation[0];
            cumulativePonderation = globalReputation[1];
            prevScore = currentScore;
            prevComplexity = currentComplexity;
            console.log("REPUTATION", finalReputation);
            console.log("PONDERATION", cumulativePonderation);
        }
    }


};

onChainTest();

