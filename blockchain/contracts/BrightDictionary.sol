// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import "@openzeppelin/contracts/proxy/Initializable.sol";

contract BrightDictionary is Initializable {

    string private version;
    mapping (bytes32 => string) private dictionary;

    function initialize(string memory currentVersion) public initializer {
        version = currentVersion;
    }

    function getValue(bytes32 key) public view returns(string memory) {
        return dictionary[key];
    }

    function setValue(bytes32 key, string memory value) public {
        dictionary[key] = value;
    }
}
