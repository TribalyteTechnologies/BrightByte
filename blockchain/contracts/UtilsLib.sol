pragma solidity 0.4.22;

library UtilsLib {

    function splitArray(bytes32[] array, uint256 start, uint256 end) public pure returns (bytes32[]) {
        bytes32[] memory newArray;
        uint arrayLength = array.length;
        if(arrayLength != 0 && end >= start && start < arrayLength) {
            uint256 newEnd;
            newEnd = (end > arrayLength)? arrayLength : end;
            newArray = new bytes32[](newEnd-start);
            for(uint256 i = start; i < newEnd; i++) {
                newArray[i-start] = array[i];
            }
        }
        return newArray;
    }


    function removeFromArray(bytes32[] storage array, bytes32 url) public {
        if(array.length > 0) {
            uint indexCommit = 0;
            bool isFound = false;
            uint lastCommitIndex = array.length - 1;
            for(uint i = lastCommitIndex; i >= 0; i--) {
                if(array[i] == url) {
                    indexCommit = i;
                    isFound = true;
                    break;
                }
            }
            if(isFound) {
                array[indexCommit] = array[lastCommitIndex];
                array.length--;
            }
        }
    }
}