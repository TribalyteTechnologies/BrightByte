pragma solidity 0.4.21;
import "./Root.sol";

contract Reputation {
    Root private root;
    address private rootAddress;

    uint256 private constant DIVISION_PARAMETER = 1000;

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
        uint256 ponderation = 0;
        uint256 complexityPonderation = 0;
        uint256 totalKnowledge = 0;
        for(uint256 j = 0; j < cleanliness.length; j++) {
            totalKnowledge += revKnowledge[j];
        }
        for(uint256 i = 0; i < cleanliness.length; i++) {
            uint256 userKnowledge = (revKnowledge[i] * DIVISION_PARAMETER) / totalKnowledge;
            ponderation += ((cleanliness[i] * DIVISION_PARAMETER) * userKnowledge);
            complexityPonderation += ((complexity[i] * DIVISION_PARAMETER) * userKnowledge);
        }
        return (ponderation/DIVISION_PARAMETER, complexityPonderation/(DIVISION_PARAMETER * 10));
    }

    function calculateUserReputation(uint256[] scores, uint256[] complexities) public onlyRoot view returns (uint256) {
        uint256 totalComplex = 0;
        uint256 reputation = 0;
        for(uint256 i = 0; i < complexities.length; i++) {
            totalComplex += complexities[i];
        }
        for(uint256 j = 0; j < scores.length; j++) {
            reputation += ((scores[j] * complexities[j] * DIVISION_PARAMETER) / totalComplex);
        }
        return reputation/(DIVISION_PARAMETER * 10);
    }
}
