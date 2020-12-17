// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

library BrightModels {

    struct UserProfile {
        string name;
        bytes32 email;
        address hash;
        UserStats globalStats;
        mapping (uint256 => UserSeason) seasonData;
    }

    struct UserStats {
        uint256 reputation;
        uint256 cumulativeComplexity;
        uint256 numberOfTimesReview;
        uint256 agreedPercentage;
        uint256 positeVotes;
        uint256 negativeVotes;
        uint256 reviewsMade;
        uint256 commitsMade;
    }

    struct UserSeason {
        UserStats seasonStats;
        mapping (bytes32 => bool) seasonCommits;
        bytes32[] urlSeasonCommits;
        bytes32[] allReviews;
        bytes32[] finishedReviews;
        bytes32[] pendingReviews;
        bytes32[] toRead;
    }

    struct HashUserMap {
        mapping (address => UserProfile) map;
    }

    struct EmailUserMap {
        mapping (bytes32 => address) map;
    }
}