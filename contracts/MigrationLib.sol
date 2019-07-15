pragma solidity 0.4.21;
import "./Root.sol";
import { BrightModels } from "./BrightModels.sol";

library MigrationLib {
    
    function setAllUserData(address[] storage allUsersArray, BrightModels.HashUserMap storage hashUserMap, BrightModels.EmailUserMap storage emailUserMap, uint32 MIGRATION_END_TIMESTAMP, string name, string mail, address hash, uint16 perct, uint16 tmRw, uint16 pos, uint16 neg, uint32 rep, uint16 rev) public {
        require (bytes(hashUserMap.hashMap[hash].name).length == 0 && bytes(hashUserMap.hashMap[hash].email).length == 0 && block.timestamp < MIGRATION_END_TIMESTAMP);
        BrightModels.UserProfile storage user = hashUserMap.hashMap[hash];
        user.name = name;
        user.email = mail;
        user.hash = hash;
        user.globalStats.agreedPercentage = perct;
        user.globalStats.numberOfTimesReview = tmRw;
        user.globalStats.positeVotes = pos;
        user.globalStats.negativeVotes = neg;
        user.globalStats.reputation = rep;
        user.globalStats.reviewsMade = rev;
        bytes32 emailId = keccak256(mail);
        emailUserMap.emailMap[emailId] = hash;
        allUsersArray.push(hash);
    }
    
    function setAllUserSeasonData(BrightModels.HashUserMap storage hashUserMap, uint8 sea, address userAddr, uint16 perct, uint16 tmRw, uint16 pos, uint16 neg, uint32 rep, uint16 rev) public {
        BrightModels.UserProfile storage user = hashUserMap.hashMap[userAddr];
        BrightModels.UserSeason storage season = user.seasonData[sea];
        season.seasonStats.numberOfTimesReview = tmRw;
        season.seasonStats.agreedPercentage = perct;
        season.seasonStats.positeVotes = pos;
        season.seasonStats.negativeVotes = neg;
        season.seasonStats.reputation = rep;
        season.seasonStats.reviewsMade = rev;
    }
    
    function setAllUserDataTwo(BrightModels.HashUserMap storage hashUserMap, uint32 MIGRATION_END_TIMESTAMP, address h, bytes32[] pendCom,  bytes32[] finRev, bytes32[] pendRev, bytes32[] toRd) public { 
        require (block.timestamp < MIGRATION_END_TIMESTAMP);
        BrightModels.UserProfile storage user = hashUserMap.hashMap[h];
        for(uint j = 0; j < pendCom.length; j++) {
            user.pendingCommits.push(pendCom[j]);
        }
        for(uint x = 0; x < finRev.length; x++) {
            user.finishedReviews.push(finRev[x]);
        }
        for(uint y = 0; y < pendRev.length; y++) {
            user.pendingReviews.push(pendRev[y]);
        }
        for(uint m = 0; m < toRd.length; m++) {
            user.toRead.push(toRd[m]);
        }
    }
    
    function setUrlsSeason(BrightModels.HashUserMap storage hashUserMap, uint32 MIGRATION_END_TIMESTAMP, uint16 seasonIndex, address userAddr, bytes32[] urls) public {
        require (block.timestamp < MIGRATION_END_TIMESTAMP);
        BrightModels.UserProfile storage user = hashUserMap.hashMap[userAddr];
        BrightModels.UserSeason storage season = user.seasonData[seasonIndex];
        for(uint16 i = 0; i < urls.length; i++) {
            season.seasonCommits[urls[i]] = true;
            season.urlSeasonCommits.push(urls[i]);
        }
    }
}
