pragma solidity 0.5.17;

import "./openzeppelin/Initializable.sol";
import { BrightDeployerLib } from "./deployers/BrightDeployerLib.sol";
import { CommitsDeployerLib } from "./deployers/CommitsDeployerLib.sol";
import { BrightByteSettingsDeployerLib } from "./deployers/BrightByteSettingsDeployerLib.sol";
import { RootDeployerLib } from "./deployers/RootDeployerLib.sol";

import "./CloudEventDispatcher.sol";

contract CloudBrightByteFactory is Initializable {

    string private currentVersion;
    address private teamManagerAddress;
    address private eventDispatcherAddress;
    CloudEventDispatcher private remoteEventDispatcher;

    struct TeamContracts {
        address brightAddress;
        address commitsAddress;
        address settingsAddress;
        address rootAddress;
    }

    mapping(uint256 => TeamContracts) private teamContracts;

    modifier onlyTeamManager() {
        require(msg.sender == teamManagerAddress, "This method can only be called by the teamManager");
        _;
    }

    function initialize(string memory version, address teamMngrAddress) public initializer {
        currentVersion = version;
        deployEventDispatcher();
        require(teamManagerAddress == address(0), "Contract already initialized");
        teamManagerAddress = teamMngrAddress;
    }

    function getCurrentVersion() public view returns (string memory) {
        return currentVersion;
    }

    function deployBright(uint256 teamUid) public onlyTeamManager{
        address addr = BrightDeployerLib.deploy();
        teamContracts[teamUid] = TeamContracts(addr, address(0), address(0), address(0));
    }

    function deployCommits(uint256 teamUid) public onlyTeamManager{
        teamContracts[teamUid].commitsAddress = CommitsDeployerLib.deploy();
    }

    function deploySettings(uint256 teamUid) public onlyTeamManager{
        teamContracts[teamUid].settingsAddress = BrightByteSettingsDeployerLib.deploy();
    }

    function deployRoot(uint256 teamUId, address userAdmin, uint seasonLength) public onlyTeamManager returns (address){
        TeamContracts storage contracts = teamContracts[teamUId];
        address bright = contracts.brightAddress;
        address commits = contracts.commitsAddress;
        address settings = contracts.settingsAddress;
        address root = RootDeployerLib.deploy(bright, commits, settings, eventDispatcherAddress, userAdmin, teamUId, seasonLength);
        contracts.rootAddress = root;
        allowEventDispatcherForContract(bright);
        allowEventDispatcherForContract(commits);
        allowEventDispatcherForContract(settings);
        allowEventDispatcherForContract(root);
    }

    function getTeamContractAddresses(uint256 teamUid) public onlyTeamManager view returns (address, address, address, address) {
        TeamContracts storage contracts = teamContracts[teamUid];
        return (contracts.brightAddress, contracts.commitsAddress, contracts.settingsAddress, contracts.rootAddress);
    }

    function getEventDispatcherAddress() public view returns (address) {
        return eventDispatcherAddress;
    }

    function setVersion(uint256 teamUid) public onlyTeamManager{
        bytes32 version = keccak256(abi.encodePacked(currentVersion));
        TeamContracts memory contracts = teamContracts[teamUid];
        RootDeployerLib.setVersion(contracts.rootAddress, version);
    }

    function inviteUserEmail(uint256 teamUid, bytes32 email) public onlyTeamManager{
        TeamContracts memory contracts = teamContracts[teamUid];
        BrightDeployerLib.inviteUserEmail(contracts.brightAddress, email);
    }

    function addAdminUser(uint256 teamUid, address memberAddress) public onlyTeamManager{
        TeamContracts memory contracts = teamContracts[teamUid];
        RootDeployerLib.addAdminUser(contracts.rootAddress, memberAddress);
    }

    function allowEventDispatcherForContract(address contractAddress) private{
        remoteEventDispatcher.addContractAllow(contractAddress);
    }

    function deployEventDispatcher() private{
        eventDispatcherAddress = address(new CloudEventDispatcher(address(this)));
        remoteEventDispatcher = CloudEventDispatcher(eventDispatcherAddress);
    }
}
