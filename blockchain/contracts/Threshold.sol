pragma solidity 0.4.22;

contract Threshold {
    uint256 private currentSeasonIndex;
    mapping (uint256 => BrightByteSeasonThreshold) seasonThresholds;

    address private rootAddress;
    address private owner;
    
    struct BrightByteSeasonThreshold {
        uint256 commitThreshold;
        uint256 reviewThreshold;
        bool isModifiedByRoot;
    }

    event newSeasonThreshold(uint256 currentSeasonIndex, uint256 commitThreshold, uint256 reviewThreshold);
    event newSeason(uint256 currentSeasonIndex, uint256 currentTimeStamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () public {
        currentSeasonIndex = 1;
    }

    function init(address _root, uint256 indexCurrentSeason) public {
        require(rootAddress == uint80(0));
        rootAddress = _root;
        currentSeasonIndex = indexCurrentSeason;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
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
        initSeasonThreshold(seasonIndex, averageNumberOfCommits, averageNumberOfReviews, false);
        emit newSeason(currentSeasonIndex, block.timestamp);
    }

    function setCurrentSeasonThreshold(uint256 commitThreshold, uint256 reviewThreshold) public onlyRoot {
        if(!seasonThresholds[currentSeasonIndex].isModifiedByRoot) {
            initSeasonThreshold(currentSeasonIndex, commitThreshold, reviewThreshold, true);
        }
    }

    function setIniatialThreshold(uint256 initialSeasonIndex, uint256[] commitsThreshold, uint256[] reviewsThreshold) public onlyRoot {
        uint256 totalNumberOfSeasons = commitsThreshold.length + initialSeasonIndex - 1;
        uint256 finalSeasonToFill = (currentSeasonIndex > totalNumberOfSeasons) ? totalNumberOfSeasons : currentSeasonIndex; 
          for(uint256 i = initialSeasonIndex; i <= finalSeasonToFill; i++) {
            uint256 index = i - initialSeasonIndex;
            initSeasonThreshold(i, commitsThreshold[index],  reviewsThreshold[index], true);
        }
    }

    function initSeasonThreshold(uint256 seasonIndex, uint256 commitThreshold, uint256 reviewThreshold, bool enable) private {
        BrightByteSeasonThreshold storage seasonThreshold = seasonThresholds[seasonIndex];
        seasonThreshold.commitThreshold = commitThreshold;
        seasonThreshold.reviewThreshold = reviewThreshold;
        seasonThreshold.isModifiedByRoot = enable;
        emit newSeasonThreshold(currentSeasonIndex, commitThreshold, reviewThreshold);
    }
}
