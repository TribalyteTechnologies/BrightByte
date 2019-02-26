pragma solidity 0.4.21;
import "./Root.sol";

contract Reputation {
    Root private root;
    address private rootAddress;

    uint40 private constant DIVISION_PARAMETER = 1000;

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

    function calculateCommitPonderation(uint40[] cleanliness, uint40[] complexity, uint40[] revKnowledge) public onlyRoot view returns (uint40, uint40) {
        uint40 ponderation = 0;
        uint40 complexityPonderation = 0;
        uint40 totalKnowledge = 0;
        for(uint8 j = 0; j < cleanliness.length; j++) {
            totalKnowledge += revKnowledge[j];
        }
        for(uint8 i = 0; i < cleanliness.length; i++) {
            uint40 userKnowledge = (revKnowledge[i] * DIVISION_PARAMETER) / totalKnowledge;
            ponderation += ((cleanliness[i] * DIVISION_PARAMETER) * userKnowledge);
            complexityPonderation += ((complexity[i] * DIVISION_PARAMETER) * userKnowledge);
        }
        return (ponderation/(DIVISION_PARAMETER * DIVISION_PARAMETER), complexityPonderation/(DIVISION_PARAMETER * 10));
    }

    function calculateUserReputation(uint40 prevReputation, uint40 prevPonderation, uint40 commitScore, uint40 commitComplexity, uint40 prevScore, uint40 prevComplexity) public onlyRoot view returns (uint40, uint40) {
        uint40 num = (prevReputation * prevPonderation) - (prevScore * prevComplexity) + (commitScore * commitComplexity);
        uint40 cumulativePonderation = prevPonderation - prevComplexity + commitComplexity;
        uint40 reputation = (num * DIVISION_PARAMETER) / cumulativePonderation;
        return (reputation/DIVISION_PARAMETER, cumulativePonderation);
    }
}
