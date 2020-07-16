pragma solidity 0.5.17;

library UtilsLib {

    function splitArray(bytes32[] storage array, uint256 start, uint256 end) public view returns (bytes32[] memory) {
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

    function getNonEmptyPositions(bytes32[] storage array) public view returns (uint256) {
        uint256 nonEmptyCount = 0;
        uint arrayLength = array.length;
        for(uint256 i = 0; i < arrayLength; i++) {
            if (array[i] != "") {
                nonEmptyCount++;
            }
        }
        return nonEmptyCount;
    }

    function removeFromArray(bytes32[] storage array, bytes32 url) public {
        uint arrayLength = array.length;
        if(arrayLength > 0) {
            uint indexCommit = 0;
            bool isFound = false;
            uint lastCommitIndex = arrayLength - 1;
            for(uint i = lastCommitIndex; i >= 0; i--) {
                if(array[i] == url) {
                    indexCommit = i;
                    isFound = true;
                    break;
                }
            }
            if(isFound) {
                array[indexCommit] = "";
            }
        }
    }

    function removeAddressFromArray(address[] storage array, address element) public {
        uint index = 0;
        bool isFound = false;
        uint256 arrayLength = array.length;
        for(uint i = 0; i < arrayLength; i++) {
            if(array[i] == element) {
                index = i;
                isFound = true;
                break;
            }
        }
        if(isFound) {
            array[index] = array[arrayLength - 1];
            delete array[arrayLength - 1];
            array.length--;
        }
    }

    function removeUintFromArray(uint256[] storage array, uint256 element) public {
        uint index = 0;
        bool isFound = false;
        uint256 arrayLength = array.length;
        for(uint i = 0; i < arrayLength; i++) {
            if(array[i] == element) {
                index = i;
                isFound = true;
                break;
            }
        }
        if(isFound) {
            array[index] = array[arrayLength - 1];
            delete array[arrayLength - 1];
            array.length--;
        }
    }

    function removeBytes32FromArray(bytes32[] storage array, bytes32 element) public {
        uint index = 0;
        bool isFound = false;
        uint256 arrayLength = array.length;
        for(uint i = 0; i < arrayLength; i++) {
            if(array[i] == element) {
                index = i;
                isFound = true;
                break;
            }
        }
        if(isFound) {
            array[index] = array[arrayLength - 1];
            delete array[arrayLength - 1];
            array.length--;
        }
    }
}