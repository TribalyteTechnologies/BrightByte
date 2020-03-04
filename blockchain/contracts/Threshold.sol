pragma solidity 0.4.22;

import "./Root.sol";

contract Threshold {
    uint256 private currentSeasonIndex;
    mapping (uint256 => BrightByteSeasonThreshold) seasonThresholds;

    Root private root;
    address private rootAddress;
    address private owner;
    
    struct BrightByteSeasonThreshold {
        uint256 commitThreshold;
        uint256 reviewThreshold;
        bool isModifiedByRoot;
    }

    event newSeasonThreshold(uint256 currentSeasonIndex, uint256 commitThreshold, uint256 reviewThreshold);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () public {
        owner = msg.sender;
        currentSeasonIndex = 1;
    }

    function init(address _root, uint256 indexCurrentSeason) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
        currentSeasonIndex = indexCurrentSeason;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier onlyRoot() {
        require(msg.sender == rootAddress);
        _;
    }

    function init(address _root) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setRootAddress(address a) public onlyOwner {
        root = Root(a);
        rootAddress = a;
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
        BrightByteSeasonThreshold storage seasonThreshold = seasonThresholds[seasonIndex];
        seasonThreshold.commitThreshold = averageNumberOfCommits;
        seasonThreshold.reviewThreshold = averageNumberOfReviews;
        emit newSeasonThreshold(currentSeasonIndex, averageNumberOfCommits, averageNumberOfReviews);
    }

    function setCurrentSeasonThreshold(uint256 commitThreshold, uint256 reviewThreshold) public onlyRoot {
        BrightByteSeasonThreshold storage seasonThreshold = seasonThresholds[currentSeasonIndex];
        if(!seasonThreshold.isModifiedByRoot) {
            seasonThreshold.commitThreshold = commitThreshold;
            seasonThreshold.reviewThreshold = reviewThreshold;
            seasonThreshold.isModifiedByRoot = true;
            emit newSeasonThreshold(currentSeasonIndex, commitThreshold, reviewThreshold);
        }
    }
}
