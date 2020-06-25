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

    mapping(uint256 => TeamContracts) private teamContracts;
    string private currentVersion;

    address private teamManagerAddress;
    address private eventDispatcherAddress;
    CloudEventDispatcher private remoteEventDispatcher;

    constructor(string version) public {
        currentVersion = version;
        deployEventDispatcher();
    }

    modifier onlyTeamManager() {
        require(msg.sender == teamManagerAddress, "This method can only be called by the teamManager");
        _;
    }

    function init(address teamMngrAddress) public {
        require(teamManagerAddress == uint80(0), "Contract already initialized");
        teamManagerAddress = teamMngrAddress;
    }

    function getCurrentVersion() public view returns (string) {
        return currentVersion;
    }

    function deployBright(uint256 teamUid) public onlyTeamManager{
        address addr = BrightDeployerLib.deploy();
        teamContracts[teamUid] = TeamContracts(addr, address(0), address(0), address(0));
    }

    function deployCommits(uint256 teamUid) public onlyTeamManager{
        teamContracts[teamUid].commitsAddress = CommitsDeployerLib.deploy();
    }

    function deployThreshold(uint256 teamUid) public onlyTeamManager{
        teamContracts[teamUid].thresholdAddress = ThresholdDeployerLib.deploy();
    }

    function deployRoot(uint256 teamUId, address userAdmin, uint seasonLength) public onlyTeamManager returns (address){
        TeamContracts storage contracts = teamContracts[teamUId];
        address bright = contracts.brightAddress;
        address commits = contracts.commitsAddress;
        address threshold = contracts.thresholdAddress;
        address root = RootDeployerLib.deploy(bright, commits, threshold, eventDispatcherAddress, userAdmin, teamUId, seasonLength);
        contracts.rootAddress = root;
        allowEventDispatcherForContract(bright);
        allowEventDispatcherForContract(commits);
        allowEventDispatcherForContract(threshold);
        allowEventDispatcherForContract(root);
    }

    function getTeamContractAddresses(uint256 teamUid) public onlyTeamManager view returns (address, address, address, address) {
        TeamContracts storage contracts = teamContracts[teamUid];
        return (contracts.brightAddress, contracts.commitsAddress, contracts.thresholdAddress, contracts.rootAddress);
    }

    function getEventDispatcherAddress() public view returns (address) {
        return eventDispatcherAddress;
    }

    function setVersion(uint256 teamUid) public onlyTeamManager{
        bytes32 version = keccak256(currentVersion);
        TeamContracts memory contracts = teamContracts[teamUid];
        RootDeployerLib.setVersion(contracts.rootAddress, version);
    }

    function inviteUserEmail(uint256 teamUid, string email) public onlyTeamManager{
        TeamContracts memory contracts = teamContracts[teamUid];
        BrightDeployerLib.inviteUserEmail(contracts.brightAddress, email);
    }

    function allowEventDispatcherForContract(address contractAddress) private{
        remoteEventDispatcher.addContractAllow(contractAddress);
    }

    function deployEventDispatcher() private{
        eventDispatcherAddress = new CloudEventDispatcher(address(this));
        remoteEventDispatcher = CloudEventDispatcher(eventDispatcherAddress);
    }
}
