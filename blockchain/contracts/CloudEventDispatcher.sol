pragma solidity 0.4.22;
import "./Root.sol";

contract CloudEventDispatcher {

    Root private root;
    address private rootAddress;
    address private owner;
    mapping (address => bool) private contractList;

    event NewUserEvent (uint256 teamId, string userName, address hash);
    event UserNewCommit (uint256 teamId, address userHash, uint256 numberOfCommits, uint256 timestamp);
    event UserNewReview (uint256 teamId, address userHash, uint256 numberOfReviews, uint256 timestamp);
    event DeletedCommit (uint256 teamId, address userHash, bytes32 url);

    constructor() public {
        owner = msg.sender;
        contractList[owner] = true;
    }

    function init(address _root) public {
        require(rootAddress == uint80(0), "The root address is alredy set");
        root = Root(_root);
        rootAddress = _root;
        contractList[rootAddress] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyRoot() {
        require(msg.sender == rootAddress);
        _;
    }

    modifier onlyAllowed() {
        require (contractList[msg.sender], "The origin address is not allowed");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "The new owner address in invalid");
        owner = newOwner;
    }

    function addContractAllow(address newAddress) public onlyRoot {
        require(newAddress != address(0), "The contract address is invalid");
        contractList[newAddress] = true;
    }

    function emitNewUserEvent (uint256 teamId, string name, address userAddress) public onlyAllowed {
        emit NewUserEvent(teamId, name, userAddress);
    }

    function emitNewCommitEvent(uint256 teamId, address userAddress, uint256 numberOfCommits) public onlyAllowed {
        emit UserNewCommit(teamId, userAddress, numberOfCommits, block.timestamp);
    }

    function emitNewReviewEvent(uint256 teamId, address userAddress, uint256 numberOfReviews) public onlyAllowed {
        emit UserNewReview(teamId, userAddress, numberOfReviews, block.timestamp);
    }

    function emitDeletedCommitEvent(uint256 teamId, address userAddress, bytes32 url) public onlyAllowed {
        emit DeletedCommit(teamId, userAddress, url);
    }
}
