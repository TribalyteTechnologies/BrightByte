// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

contract CloudEventDispatcher {

    mapping (address => bool) private ownerList;
    mapping (address => bool) private contractList;

    event NewUserEvent (uint256 teamUid, address hash, uint256 brightbyteVersion);
    event UserNewCommit (uint256 teamUid, address userHash, uint256 numberOfCommits, uint256 timestamp, uint256 brightbyteVersion);
    event UserNewReview (uint256 teamUid, address userHash, uint256 numberOfReviews, uint256 timestamp, uint256 brightbyteVersion);
    event DeletedCommit (uint256 teamUid, address userHash, bytes32 url, uint256 brightbyteVersion);
    event NewSeason(uint256 teamUid, uint256 currentSeasonIndex, uint256 brightbyteVersion);

    modifier onlyOwner() {
        require(ownerList[msg.sender], "The origin is not allowed");
        _;
    }

    modifier onlyAllowed() {
        require (contractList[msg.sender], "The origin address is not allowed");
        _;
    }

    constructor() {
        ownerList[msg.sender] = true;
        contractList[msg.sender] = true;
    }

    function addNewOwner(address newOwner) public onlyOwner {
        require(newOwner != address(0), "The new owner address in invalid");
        ownerList[newOwner] = true;
        contractList[newOwner] = true;
    }

    function addContractAllow(address newAddress) public onlyOwner {
        require(newAddress != address(0), "The contract address is invalid");
        contractList[newAddress] = true;
    }

    function emitNewUserEvent (uint256 teamUid, address userAddress, uint256 brightbyteVersion) public onlyAllowed {
        emit NewUserEvent(teamUid, userAddress, brightbyteVersion);
    }

    function emitNewCommitEvent(uint256 teamUid, address userAddress, uint256 numberOfCommits, uint256 brightbyteVersion) public onlyAllowed {
        emit UserNewCommit(teamUid, userAddress, numberOfCommits, block.timestamp, brightbyteVersion);
    }

    function emitNewReviewEvent(uint256 teamUid, address userAddress, uint256 numberOfReviews, uint256 brightbyteVersion) public onlyAllowed {
        emit UserNewReview(teamUid, userAddress, numberOfReviews, block.timestamp, brightbyteVersion);
    }

    function emitDeletedCommitEvent(uint256 teamUid, address userAddress, bytes32 url, uint256 brightbyteVersion) public onlyAllowed {
        emit DeletedCommit(teamUid, userAddress, url, brightbyteVersion);
    }

    function emitNewSeason (uint256 teamUid, uint256 currentSeasonIndex,  uint256 brightbyteVersion) public onlyAllowed {
        emit NewSeason(teamUid, currentSeasonIndex, brightbyteVersion);
    }
}
