pragma solidity 0.4.22;

import { BrightDeployerLib } from "./deployers/BrightDeployerLib.sol";
import { CommitsDeployerLib } from "./deployers/CommitsDeployerLib.sol";
import { ThresholdDeployerLib } from "./deployers/ThresholdDeployerLib.sol";
import { RootDeployerLib } from "./deployers/RootDeployerLib.sol";

import "./CloudEventDispatcher.sol";

contract CloudBrightByteFactory {
    
    struct TeamContracts {
        address brightAddress;
        address commitsAddress;
        address thresholdAddress;
        address rootAddress;
    }
    
    mapping(uint256 => TeamContracts) teamContracts;
    string private currentVersion;

    address eventDispatcherAddress;
    CloudEventDispatcher remoteEventDispatcher;
    
    constructor(string version) public {
        currentVersion = version;
        deployEventDispatcher();
    }
    
    function getCurrentVersion() public view returns (string) {
        return currentVersion;
    }
    
    function deployBright(uint256 teamUid) public{
        address addr = BrightDeployerLib.deploy();
        teamContracts[teamUid] = TeamContracts(addr, address(0), address(0), address(0));
    }

    function deployCommits(uint256 teamUid) public{
        teamContracts[teamUid].commitsAddress = CommitsDeployerLib.deploy();
    }
    
    function deployThreshold(uint256 teamUid) public{
        teamContracts[teamUid].thresholdAddress = ThresholdDeployerLib.deploy();
    }

    function deployRoot(uint256 teamUId, address userAdmin) public returns (address){
        TeamContracts storage contracts = teamContracts[teamUId];
        address bright = contracts.brightAddress;
        address commits = contracts.commitsAddress;
        address threshold = contracts.thresholdAddress;
        address root = RootDeployerLib.deploy(bright, commits, threshold, eventDispatcherAddress, userAdmin, teamUId);
        contracts.rootAddress = root;
        allowEventDispatcherForContract(bright);
        allowEventDispatcherForContract(commits);
        allowEventDispatcherForContract(threshold);
        allowEventDispatcherForContract(root);
    }
    
    function getTeamContractAddresses(uint256 teamUid) public view returns (address, address, address, address) {
        TeamContracts storage contracts = teamContracts[teamUid];
        return (contracts.brightAddress, contracts.commitsAddress, contracts.thresholdAddress, contracts.rootAddress);
    }

    function getEventDispatcherAddress() public view returns (address) {
        return eventDispatcherAddress;
    }
    
    function allowEventDispatcherForContract(address contractAddress) private{
        remoteEventDispatcher.addContractAllow(contractAddress);
    }
    
    function deployEventDispatcher() private{
        eventDispatcherAddress = new CloudEventDispatcher(address(this));
        remoteEventDispatcher = CloudEventDispatcher(eventDispatcherAddress);
    }
}
