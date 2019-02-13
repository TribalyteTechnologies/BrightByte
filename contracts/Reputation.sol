pragma solidity 0.4.21;
import "./Root.sol";

contract Reputation {
    Root private root;
    address private rootAddress;

    uint256 private constant numberOfCriteria = 3;
    uint256 private criteriaWorth;

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
        criteriaWorth = 1000 / numberOfCriteria;
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

    function calculatePonderation(uint256[] points) public onlyOwner view returns (uint256) {
        require(numberOfCriteria == points.length);
        uint256 ponderation = 0;
        for(uint i = 0; i < numberOfCriteria; i++) {
            ponderation += (points[i] * criteriaWorth);
        }
        return ponderation/1000;
    }

}
