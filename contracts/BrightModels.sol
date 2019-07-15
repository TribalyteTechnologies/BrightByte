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
        mapping (uint16 => UserSeason) seasonData;
    }
    
    struct UserStats {
        uint32 reputation;
        uint32 cumulativeComplexity;
        uint16 numberOfTimesReview;
        uint16 agreedPercentage;
        uint16 positeVotes;
        uint16 negativeVotes;
        uint16 reviewsMade;
    }
    
    struct UserSeason {
        UserStats seasonStats;
        mapping (bytes32 => bool) seasonCommits;
        bytes32[] urlSeasonCommits;
    }
    
    struct HashUserMap {
        mapping (address => UserProfile) hashMap;
    }
    
    struct EmailUserMap {
        mapping (bytes32 => address) emailMap;
    }
}