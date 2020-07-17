pragma solidity 0.5.17;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract BrightByteSettings is Initializable {
    uint256 private currentSeasonIndex;
    bool private isRandomReviewer;
    mapping (uint256 => BrightByteSeasonThreshold) seasonThresholds;
    bytes32[] private textRules;

    address private rootAddress;
    address private owner;

    struct BrightByteSeasonThreshold {
        uint256 commitThreshold;
        uint256 reviewThreshold;
    }

    event newSeasonThreshold(uint256 currentSeasonIndex, uint256 commitThreshold, uint256 reviewThreshold);
    event newSeason(uint256 currentSeasonIndex, uint256 currentTimeStamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function initialize(address _root, uint256 indexCurrentSeason) public initializer {
        require(rootAddress == address(0), "Root address cannot be 0");
        rootAddress = _root;
        currentSeasonIndex = indexCurrentSeason;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Sender address is not contract owner");
        _;
    }
    modifier onlyRoot() {
        require(msg.sender == rootAddress, "The request origin is not allowed");
        _;
    }

    function getSeasonThreshold(uint256 seasonIndex) public view returns(uint256, uint256) {
        BrightByteSeasonThreshold memory seasonThreshold = seasonThresholds[seasonIndex];
        return (seasonThreshold.commitThreshold, seasonThreshold.reviewThreshold);
    }

    function getCurrentSeasonThreshold() public view returns(uint256, uint256) {
        BrightByteSeasonThreshold memory seasonThreshold = seasonThresholds[currentSeasonIndex];
        return (seasonThreshold.commitThreshold, seasonThreshold.reviewThreshold);
    }

    function setNewSeasonThreshold(uint256 seasonIndex, uint256 averageNumberOfCommits, uint256 averageNumberOfReviews) public onlyRoot {
        currentSeasonIndex = seasonIndex;
        initSeasonThreshold(seasonIndex, averageNumberOfCommits, averageNumberOfReviews);
        emit newSeason(currentSeasonIndex, block.timestamp);
    }

    function setCurrentSeasonThreshold(uint256 commitThreshold, uint256 reviewThreshold) public onlyRoot {
        initSeasonThreshold(currentSeasonIndex, commitThreshold, reviewThreshold);
    }

    function setIniatialThreshold(uint256 initialSeasonIndex, uint256[] memory commitsThreshold, uint256[] memory reviewsThreshold)
    public onlyRoot {
        uint256 totalNumberOfSeasons = commitsThreshold.length + initialSeasonIndex - 1;
        uint256 finalSeasonToFill = (currentSeasonIndex > totalNumberOfSeasons) ? totalNumberOfSeasons : currentSeasonIndex;
        for(uint256 i = initialSeasonIndex; i <= finalSeasonToFill; i++) {
            uint256 index = i - initialSeasonIndex;
            initSeasonThreshold(i, commitsThreshold[index],  reviewsThreshold[index]);
        }
    }

    function getTextRules() public view onlyRoot returns(bytes32[] memory) {
        return textRules;
    }

    function addTextRules(bytes32 newText) public onlyRoot {
        textRules.push(newText);
    }

    function clearTextRules() public onlyRoot {
        delete textRules;
    }

    function getRandomReviewer() public view onlyRoot returns(bool) {
        return isRandomReviewer;
    }

    function setRandomReviewer(bool newValue) public onlyRoot {
        isRandomReviewer = newValue;
    }

    function initSeasonThreshold(uint256 seasonIndex, uint256 commitThreshold, uint256 reviewThreshold) private {
        BrightByteSeasonThreshold storage seasonThreshold = seasonThresholds[seasonIndex];
        seasonThreshold.commitThreshold = commitThreshold;
        seasonThreshold.reviewThreshold = reviewThreshold;
        emit newSeasonThreshold(currentSeasonIndex, commitThreshold, reviewThreshold);
    }
}
