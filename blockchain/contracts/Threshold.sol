pragma solidity 0.5.2;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract Threshold is Initializable {
    uint256 private currentSeasonIndex;
    mapping (uint256 => BrightByteSeasonThreshold) seasonThresholds;

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

    function initSeasonThreshold(uint256 seasonIndex, uint256 commitThreshold, uint256 reviewThreshold) private {
        BrightByteSeasonThreshold storage seasonThreshold = seasonThresholds[seasonIndex];
        seasonThreshold.commitThreshold = commitThreshold;
        seasonThreshold.reviewThreshold = reviewThreshold;
        emit newSeasonThreshold(currentSeasonIndex, commitThreshold, reviewThreshold);
    }
}
