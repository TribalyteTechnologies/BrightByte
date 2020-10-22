pragma solidity 0.5.17;

interface IRoot {
    function allowNewUser(address userAddress) external;
    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) external view returns (address);
    function getNumberOfReviews(bytes32 url) external view returns (uint, uint);
    function deleteCommit(bytes32 url) external;
    function calculateUserReputation(bytes32 commitsUrl, uint256 reputation, uint256 cumulativeComplexity)
    external view returns (uint256, uint256);
    function setNewSeasonThreshold(uint256 currentSeasonIndex, uint256 averageNumberOfCommits, uint256 averageNumberOfReviews) external;

    function setNewCommit(bytes32 url) external;
    function checkCommitSeason(bytes32 url,address author) external view returns (bool);
    function calculatePonderation(uint256[] calldata cleanliness, uint256[] calldata complexity, uint256[] calldata revKnowledge)
    external view returns(uint256, uint256);
    function setReview(bytes32 url,address a) external;
}

interface IBright {
    function initialize(address _root, address _cloudEventDispatcherAddress, uint256 teamId, uint256 seasonLength, address userAdmin) external;
    function setVersion(bytes32 version) external;
    function getCurrentSeason() external view returns (uint256, uint256, uint256);
    function setCommit(bytes32 url) external;
    function checkCommitSeason(bytes32 url,address author) external view returns (bool);
    function getAddressByEmail(bytes32 email) external view returns(address);
    function notifyCommit(string calldata a, bytes32 email) external;
    function setReview(bytes32 url, address author) external;
    function setFeedback(bytes32 url, address userAddr, bool value, uint256 vote) external;
    function setSeasonLength(uint256 seasonLengthDays) external;
}

interface ICommit {
    function initialize(address _root) external;
    function isCommit(bytes32 _url) external view returns(bool,bool);
    function notifyCommit(bytes32 url,address a) external;
    function readCommit(bytes32 _url) external;
    function setVote(bytes32 url, address user, uint256 vote) external;
    function getCommitScores(bytes32 url) external view returns (uint256, uint256, uint256, uint256);
    function getNumbersNeedUrl(bytes32 _url) external view returns (uint, uint);
    function deleteCommit(bytes32 url) external;
    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) external view returns (address);
    function allowNewUser(address userAddress) external;
}
