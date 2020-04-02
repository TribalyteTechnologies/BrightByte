pragma solidity 0.4.22;

import { BrightDeployerLib } from "./deployers/BrightDeployerLib.sol";
import { CommitsDeployerLib } from "./deployers/CommitsDeployerLib.sol";
import { ThresholdDeployerLib } from "./deployers/ThresholdDeployerLib.sol";
import { RootDeployerLib } from "./deployers/RootDeployerLib.sol";

import "./CloudEventDispatcher.sol";

contract CloudBrightByteFactory {
    
    mapping(uint256 => Contracts) teamContracts;
    string currentVersion;

    address eventDispatcherAddress;
    CloudEventDispatcher remoteEventDispatcher;
    
    struct Contracts {
        address brightAddress;
        address commitsAddress;
        address thresholdAddress;
        address rootAddress;
    }
    
    constructor(string version) public {
        currentVersion = version;
        deployEventDispatcher();
    }
    
    function deployBright(uint256 teamUId) public{
        address addr = BrightDeployerLib.deploy();
        teamContracts[teamUId] = Contracts(addr, address(0), address(0), address(0));
    }

    function deployCommits(uint256 teamUId) public{
        teamContracts[teamUId].commitsAddress = CommitsDeployerLib.deploy();
    }
    
    function deployThreshold(uint256 teamUId) public{
        teamContracts[teamUId].thresholdAddress = ThresholdDeployerLib.deploy();
    }

    function deployRoot(uint256 teamUId, uint256 seasonLengthInDays) public returns (address){
        address bright = teamContracts[teamUId].brightAddress;
        address commits = teamContracts[teamUId].commitsAddress;
        address threshold = teamContracts[teamUId].thresholdAddress;
        address root = RootDeployerLib.deploy(bright, commits, threshold, eventDispatcherAddress, seasonLengthInDays);
        teamContracts[teamUId].rootAddress = root;
        allowEventDispatcherForContract(bright);
        allowEventDispatcherForContract(commits);
        allowEventDispatcherForContract(threshold);
        allowEventDispatcherForContract(root);
    }
    
    function getTeamContractAddresses(uint256 teamUId) public view returns (address, address, address, address) {
        return (teamContracts[teamUId].brightAddress, teamContracts[teamUId].commitsAddress, teamContracts[teamUId].thresholdAddress, teamContracts[teamUId].rootAddress);
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
