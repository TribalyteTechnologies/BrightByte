pragma solidity 0.4.22;

interface IRoot {
    function allowNewUser(address userAddress) public;
    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) public view returns (address);
    function getNumberOfReviews(bytes32 url) public view returns (uint, uint);
    function deleteCommit(bytes32 url) public;
    function calculateUserReputation(bytes32 commitsUrl, uint256 reputation, uint256 cumulativeComplexity)
    public view returns (uint256, uint256);
    function setNewSeasonThreshold(uint256 currentSeasonIndex, uint256 averageNumberOfCommits, uint256 averageNumberOfReviews) public;

    function setNewCommit(bytes32 url) public;
    function checkCommitSeason(bytes32 url,address author) public view returns (bool);
    function calculatePonderation(uint256[] cleanliness, uint256[] complexity, uint256[] revKnowledge) public view returns(uint256, uint256);
    function setReview(bytes32 url,address a) public;
}

interface IBright {
    function init(address _root, address _cloudEventDispatcherAddress, uint256 teamId, uint256 seasonLength, address userAdmin) public;
    function getCurrentSeason() public view returns (uint256, uint256, uint256);
    function setCommit(bytes32 url) public;
    function checkCommitSeason(bytes32 url,address author) public view returns (bool);
    function getAddressByEmail(bytes32 email) public view returns(address);
    function notifyCommit(string a, bytes32 email) public;
    function setReview(bytes32 url, address author) public;
    function setFeedback(bytes32 url, address userAddr, bool value, uint256 vote) public;
    function setSeasonLength(uint256 seasonLengthDays) public;
}

interface ICommit {
    function init(address _root) public;
    function isCommit(bytes32 _url) public view returns(bool,bool);
    function notifyCommit(bytes32 url,address a) public;
    function readCommit(bytes32 _url) public;
    function setVote(bytes32 url, address user, uint256 vote) public;
    function getCommitScores(bytes32 url) public view returns (uint256, uint256, uint256, uint256);
    function getNumbersNeedUrl(bytes32 _url) public view returns (uint, uint);
    function deleteCommit(bytes32 url) public;
    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) public view returns (address);
    function allowNewUser(address userAddress) public;
}
