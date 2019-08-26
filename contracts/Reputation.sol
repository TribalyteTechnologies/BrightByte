pragma solidity 0.4.21;
import "./Root.sol";

contract Reputation {
    uint256 private constant WEIGHT_FACTOR = 1000;
    Root private root;
    address private rootAddress;
    address private owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function Reputation() public {
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier onlyRoot() {
        require(msg.sender == rootAddress);
        _;
    }
    modifier onlyDapp() {
        require (msg.sender == rootAddress || msg.sender == tx.origin);
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

    function calculateCommitPonderation(uint256[] cleanliness, uint256[] complexity, uint256[] revKnowledge) public onlyRoot view returns (uint256, uint256) {
        uint256 weightedCleanliness = 0;
        uint256 complexityPonderation = 0;
        uint256 totalKnowledge = 0;
        for(uint256 j = 0; j < cleanliness.length; j++) {
            totalKnowledge += revKnowledge[j];
        }
        for(uint256 i = 0; i < cleanliness.length; i++) {
            uint256 userKnowledge = (uint256(revKnowledge[i]) * WEIGHT_FACTOR) / totalKnowledge;
            weightedCleanliness += (cleanliness[i] * userKnowledge);
            complexityPonderation += (complexity[i] * userKnowledge);
        }
        return (weightedCleanliness/WEIGHT_FACTOR, complexityPonderation/WEIGHT_FACTOR);
    }

    function calculateUserReputation(uint256 prevReputation, uint256 prevPonderation, uint256 commitScore, uint256 commitComplexity, uint256 prevScore, uint256 prevComplexity) public onlyRoot view returns (uint256, uint256) {
        uint256 num = (prevReputation * prevPonderation) - (prevScore * prevComplexity) + (commitScore * commitComplexity);
        uint256 cumulativePonderation = prevPonderation - prevComplexity + commitComplexity;
        uint256 reputation = (num * WEIGHT_FACTOR) / cumulativePonderation;
        return (reputation/WEIGHT_FACTOR, cumulativePonderation);
    }
}
