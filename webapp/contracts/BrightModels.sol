pragma solidity 0.4.21;

library BrightModels {
    
    struct UserProfile {
        string name;
        string email;
        address hash;
        bytes32[] pendingCommits;
        bytes32[] finishedReviews;
        bytes32[] pendingReviews;
        bytes32[] toRead;
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
    }
    
    struct UserSeason {
        UserStats seasonStats;
        mapping (bytes32 => bool) seasonCommits;
        bytes32[] urlSeasonCommits;
    }
    
    struct HashUserMap {
        mapping (address => UserProfile) map;
    }
    
    struct EmailUserMap {
        mapping (bytes32 => address) map;
    }
}