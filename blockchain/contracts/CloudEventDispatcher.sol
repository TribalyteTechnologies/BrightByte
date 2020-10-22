pragma solidity 0.5.17;

contract CloudEventDispatcher {

    mapping (address => bool) private ownerList;
    mapping (address => bool) private contractList;

    event NewUserEvent (uint256 teamUid, address hash);
    event UserNewCommit (uint256 teamUid, address userHash, uint256 numberOfCommits, uint256 timestamp);
    event UserNewReview (uint256 teamUid, address userHash, uint256 numberOfReviews, uint256 timestamp);
    event DeletedCommit (uint256 teamUid, address userHash, bytes32 url);
    event NewSeason(uint256 teamUid, uint256 currentSeasonIndex);

    modifier onlyOwner() {
        require(ownerList[msg.sender], "The origin is not allowed");
        _;
    }

    modifier onlyAllowed() {
        require (contractList[msg.sender], "The origin address is not allowed");
        _;
    }

    constructor(address brightByteFactory) public {
        ownerList[msg.sender] = true;
        contractList[msg.sender] = true;
    }

    function addNewOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "The new owner address in invalid");
        ownerList[newOwner] = true;
    }

    function addContractAllow(address newAddress) public onlyOwner {
        require(newAddress != address(0), "The contract address is invalid");
        contractList[newAddress] = true;
    }

    function emitNewUserEvent (uint256 teamUid, address userAddress) public onlyAllowed {
        emit NewUserEvent(teamUid, userAddress);
    }

    function emitNewCommitEvent(uint256 teamUid, address userAddress, uint256 numberOfCommits) public onlyAllowed {
        emit UserNewCommit(teamUid, userAddress, numberOfCommits, block.timestamp);
    }

    function emitNewReviewEvent(uint256 teamUid, address userAddress, uint256 numberOfReviews) public onlyAllowed {
        emit UserNewReview(teamUid, userAddress, numberOfReviews, block.timestamp);
    }

    function emitDeletedCommitEvent(uint256 teamUid, address userAddress, bytes32 url) public onlyAllowed {
        emit DeletedCommit(teamUid, userAddress, url);
    }

    function emitNewSeason (uint256 teamUid, uint256 currentSeasonIndex) public onlyAllowed {
        emit NewSeason(teamUid, currentSeasonIndex);
    }
}
