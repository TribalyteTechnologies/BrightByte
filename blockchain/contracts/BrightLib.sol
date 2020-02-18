pragma solidity 0.4.22;
import "./Root.sol";
import { BrightModels } from "./BrightModels.sol";

library BrightLib {
    
    function getPendingReviews(BrightModels.UserSeason storage userSeason, uint256 start, uint256 end) public view returns(bytes32[]) {
        bytes32[] memory newPendingReviews;
        if(userSeason.pendingReviews.length != 0 && end >= start){
            uint256 newEnd;
            newEnd = (end > userSeason.pendingReviews.length)? userSeason.pendingReviews.length : end;
            newPendingReviews = new bytes32[](newEnd-start);
            for(uint256 i = start; i < newEnd; i++) {
                newPendingReviews[i-start] = userSeason.pendingReviews[i];
            }
        }
        return newPendingReviews;
    }

    function getFinishedReviews(BrightModels.UserSeason storage userSeason, uint256 start, uint256 end) public view returns(bytes32[]) {
        bytes32[] memory newFinishedReviews;
        if(userSeason.finishedReviews.length != 0 && end >= start) {
            uint256 newEnd;
            newEnd = (end > userSeason.finishedReviews.length)? userSeason.finishedReviews.length : end;
            newFinishedReviews = new bytes32[](newEnd-start);
            for(uint256 i = start; i < newEnd; i++) {
                newFinishedReviews[i-start] = userSeason.finishedReviews[i];
            }
        }
        return newFinishedReviews;
    }

    function getUrlSeasonCommits(BrightModels.UserSeason storage userSeason, uint256 start, uint256 end) public view returns(bytes32[]) {
        bytes32[] memory newUrlSeasonCommits;
        if(userSeason.urlSeasonCommits.length != 0 && end >= start) {
            uint256 newEnd;
            newEnd = (end > userSeason.urlSeasonCommits.length)? userSeason.urlSeasonCommits.length : end;
            newUrlSeasonCommits = new bytes32[](newEnd-start);
            for(uint256 i = start; i < newEnd; i++) {
                newUrlSeasonCommits[i-start] = userSeason.urlSeasonCommits[i];
            }
        }
        return newUrlSeasonCommits;
    }

   function getToRead(BrightModels.UserSeason storage userSeason, uint256 start, uint256 end) public view returns(bytes32[]) {
        bytes32[] memory newToRead;
        if(userSeason.toRead.length != 0 && end >= start) {
            uint256 newEnd;
            newEnd = (end > userSeason.toRead.length)? userSeason.toRead.length : end;
            newToRead = new bytes32[](newEnd-start);
            for(uint256 i = start; i < newEnd; i++) {
                newToRead[i-start] = userSeason.toRead[i];
            }
        }
        return newToRead;
    }
}