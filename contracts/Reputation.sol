pragma solidity 0.4.21;
import "./Root.sol";

contract Reputation {
    Root private root;
    address private rootAddress;

    uint32 private constant WEIGHT_FACTOR = 1000;

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

    function calculateCommitPonderation(uint16[] cleanliness, uint16[] complexity, uint16[] revKnowledge) public onlyRoot view returns (uint32, uint32) {
        uint32 weightedCleanliness = 0;
        uint32 complexityPonderation = 0;
        uint32 totalKnowledge = 0;
        for(uint8 j = 0; j < cleanliness.length; j++) {
            totalKnowledge += revKnowledge[j];
        }
        for(uint8 i = 0; i < cleanliness.length; i++) {
            uint32 userKnowledge = (revKnowledge[i] * WEIGHT_FACTOR) / totalKnowledge;
            weightedCleanliness += (cleanliness[i] * userKnowledge);
            complexityPonderation += (complexity[i] * userKnowledge);
        }
        return (weightedCleanliness/WEIGHT_FACTOR, complexityPonderation/WEIGHT_FACTOR);
    }

    function calculateUserReputation(uint32 prevReputation, uint32 prevPonderation, uint32 commitScore, uint32 commitComplexity, uint32 prevScore, uint32 prevComplexity) public onlyRoot view returns (uint32, uint32) {
        uint32 num = (prevReputation * prevPonderation) - (prevScore * prevComplexity) + (commitScore * commitComplexity);
        uint32 cumulativePonderation = prevPonderation - prevComplexity + commitComplexity;
        uint32 reputation = (num * WEIGHT_FACTOR) / cumulativePonderation;
        return (reputation/WEIGHT_FACTOR, cumulativePonderation);
    }
}
