pragma solidity 0.5.2;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract CloudProjectStore is Initializable {

    struct ProjectMap {
        uint256 projectCount;
        mapping(string => uint256) projects;
        mapping(uint256 => string) indexProject;
    }

    uint256 private PROJECT_PAGE_SIZE = 5;

    uint256 private teamCount;
    mapping(uint256 => ProjectMap) private teamProjects;

    address private teamManagerAddress;

    function initialize(address teamMngrAddress) public initializer {
        require(teamManagerAddress == address(0), "Contract already initialized");
        teamManagerAddress = teamMngrAddress;
        teamCount = 0;
    }

    modifier onlyTeamManager() {
        require(msg.sender == teamManagerAddress, "This method can only be called by the teamManager");
        _;
    }

    function doesTeamExists(uint256 teamUid) public view returns (bool) {
        return teamProjects[teamUid].projectCount != 0;
    }

    function addProject(uint256 teamUid, string memory projectName) public onlyTeamManager {
        require(teamUid != 0, "Cannot add project to default team");
        ProjectMap storage savedProjMap = teamProjects[teamUid];
        string memory storedProjectName = savedProjMap.indexProject[savedProjMap.projects[projectName]];
        if (keccak256(abi.encodePacked(storedProjectName)) != keccak256(abi.encodePacked(projectName))){
            savedProjMap.projects[projectName] = savedProjMap.projectCount;
            savedProjMap.indexProject[savedProjMap.projectCount] = projectName;
            savedProjMap.projectCount++;
        }
    }

    function clearAllProjects(uint256 teamUid) public onlyTeamManager {
        require(teamUid != 0, "Cannot add project to default team");
        ProjectMap storage savedProjMap = teamProjects[teamUid];
        for(uint256 i = 0; i < savedProjMap.projectCount; i++) {
            string memory projName = savedProjMap.indexProject[i];
            delete savedProjMap.projects[projName];
            delete savedProjMap.indexProject[i];
        }
        savedProjMap.projectCount = 0;
    }

    function getAllProjects(uint256 teamUid, uint256 pageNumber)
    public view returns (string memory, string memory, string memory, string memory, string memory) {
        ProjectMap storage savedProjMap = teamProjects[teamUid];
        string[] memory projects = new string[](PROJECT_PAGE_SIZE);
        uint256 start = pageNumber * PROJECT_PAGE_SIZE;
        uint256 end = start + PROJECT_PAGE_SIZE;
        for (uint256 i = start; i < end; i++) {
            string memory currentProject = savedProjMap.indexProject[i];
            projects[i - start] = currentProject;
        }
        return (projects[0], projects[1], projects[2], projects[3], projects[4]);
    }

    function getProjectPageCount(uint256 teamUid) public view returns (uint256) {
        ProjectMap storage savedProjMap = teamProjects[teamUid];
        uint256 pages = 0;
        if (savedProjMap.projectCount != 0) {
            pages = savedProjMap.projectCount /
                PROJECT_PAGE_SIZE;
            if (savedProjMap.projectCount % PROJECT_PAGE_SIZE == 0) {
                pages--;
            }
        }
        return pages;
    }
}
