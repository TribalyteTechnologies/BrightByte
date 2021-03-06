// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/proxy/Initializable.sol";

contract BrightByteSettings is Initializable {

    uint256 private currentSeasonIndex;
    bool private isRandomReviewer;
    address private rootAddress;
    address private owner;
    bytes32[] private textRules;

    struct BrightByteSeasonThreshold {
        uint256 commitThreshold;
        uint256 reviewThreshold;
    }

    mapping (uint256 => BrightByteSeasonThreshold) private seasonThresholds;

    event newSeasonThreshold(uint256 currentSeasonIndex, uint256 commitThreshold, uint256 reviewThreshold);
    event newSeason(uint256 currentSeasonIndex, uint256 currentTimeStamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Sender address is not contract owner");
        _;
    }
    modifier onlyRoot() {
        require(msg.sender == rootAddress, "The request origin is not allowed");
        _;
    }

    function initialize(address _root, uint256 indexCurrentSeason) public initializer {
        require(rootAddress == address(0), "Root address cannot be 0");
        rootAddress = _root;
        currentSeasonIndex = indexCurrentSeason;
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

    function setTextRules(bytes32[] memory newText) public onlyRoot {
        textRules = newText;
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
