pragma solidity 0.5.17;

import { UtilsLib } from "./UtilsLib.sol";
import { IRoot, ICommit } from "./IBrightByte.sol";

contract Commits is ICommit {
    IRoot private root;
    address private rootAddress;
    bytes32[] private allCommitsArray;
    mapping (bytes32 => Commit) private storedData;
    mapping (address => bool) private allowedAddresses;

    uint256[] quality;
    uint256[] confidence;
    uint256[] complexity;

    address private owner;

    struct Commit {
        string title;
        string url;
        address author;
        uint256 creationDate;
        bool isReadNeeded;
        uint256 lastModificationDate;
        uint256 numberReviews;
        uint256 currentNumberReviews;
        uint256 score;
        uint256 weightedComplexity;
        uint256 previousScore;
        uint256 previousComplexity;
        address[] pendingComments;
        address[] finishedComments;
        mapping (address => Comment) commitComments;
    }
    struct Comment{
        string text;
        address author;
        uint256[] points;
        uint256 vote; //0 => no vote, 1 => dont agree, 2 => agree, 3 => report abuse
        uint256 creationDate;
        uint256 lastModificationDate;
    }
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not contract owner");
        _;
    }
    modifier onlyRoot() {
        require(msg.sender == rootAddress, "Invalid Root addresss");
        _;
    }
    modifier onlyAllowed() {
        require (allowedAddresses[msg.sender], "The address is not allowed.");
        _;
    }

    function init(address _root) public {
        require(rootAddress == address(0), "Root address cannot be 0");
        root = IRoot(_root);
        rootAddress = _root;
        allowedAddresses[rootAddress] = true;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner address cannot be 0");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    function setRootAddress(address a) public onlyOwner {
        root = IRoot(a);
        rootAddress = a;
    }

    function setNewCommit (string memory _title, string memory _url, uint256 _users) public onlyAllowed {
        address auth = tx.origin;
        address[] memory a;
        bytes32 _id = keccak256(abi.encodePacked(_url));
        if(storedData[_id].author == address(0)){
            storedData[_id] = Commit(_title, _url, msg.sender, block.timestamp, false, block.timestamp,_users, 0, 0, 0, 0, 0, a,a);
            allCommitsArray.push(_id);
            if(msg.sender == tx.origin){
                root.setNewCommit(_id);
            }
        } else {
            require(storedData[_id].author == auth, "Author is not tx sender");
            storedData[_id].title = _title;
        }
    }
    function notifyCommit(bytes32 url,address a) public onlyRoot {
        require(storedData[url].author == tx.origin, "Author is not tx sender");
        bool saved = false;
        for(uint256 i = 0; i < storedData[url].pendingComments.length; i++){
            if(a == storedData[url].pendingComments[i]){
                saved = true;
                break;
            }
        }
        if(!saved){
            for(uint256 i = 0; i < storedData[url].finishedComments.length; i++){
                if(a == storedData[url].finishedComments[i]){
                    saved = true;
                    break;
                }
            }
        }
        if(!saved){
            storedData[url].pendingComments.push(a);
        }
    }

    function deleteCommit(bytes32 url) public onlyRoot {
        UtilsLib.removeFromArray(allCommitsArray, url);
        delete storedData[url];
    }

    function getDetailsCommits(bytes32 _url) public onlyAllowed view
    returns(string memory, string memory, address, uint, uint, bool, uint256, uint256, uint256){
        bytes32 id = _url;
        Commit memory data = storedData[id];
        return (data.url,
                data.title,
                data.author,
                data.creationDate,
                data.lastModificationDate,
                data.isReadNeeded,
                data.numberReviews,
                data.currentNumberReviews,
                data.score
        );
    }
    function getCommitScore(bytes32 _id) public onlyAllowed view returns(uint256, uint256){
        return(storedData[_id].score, storedData[_id].weightedComplexity);
    }
    function getNumbers() public onlyAllowed view returns(uint){
        return allCommitsArray.length;
    }
    function getAllCommitsId(uint index) public onlyAllowed view returns(bytes32){
        return allCommitsArray[index];
    }
    function getNumbersNeedUrl(bytes32 _url) public onlyAllowed view returns (uint, uint){
        return (storedData[_url].pendingComments.length,
                storedData[_url].finishedComments.length
        );
    }
    function getCommentsOfCommit(bytes32 _url) public onlyAllowed view returns(address[] memory, address[] memory){
        return (
            storedData[_url].pendingComments,
            storedData[_url].finishedComments
        );
    }
    function getCommentDetail(bytes32 url, address a)
    public onlyAllowed view returns(string memory, uint256, uint, uint, address, uint256[] memory){
        Comment memory comment = storedData[url].commitComments[a];
        return(
            comment.text,
            comment.vote,
            comment.creationDate,
            comment.lastModificationDate,
            comment.author,
            comment.points
        );
    }

    function setReview(string memory _url,string memory _text, uint256[] memory points) public onlyAllowed {
        bytes32 url = keccak256(abi.encodePacked(_url));
        address author = tx.origin;

        Commit storage commit = storedData[url];
        bool saved = false;
        for (uint256 j = 0;j < commit.pendingComments.length; j++){
            if (author == commit.pendingComments[j]){
                commit.pendingComments[j] = commit.pendingComments[commit.pendingComments.length-1];
                commit.pendingComments.length--;
                saved = true;
                break;
            }
        }
        require(saved, "Didn't find the commit on pending comments");
        commit.finishedComments.push(author);
        Comment storage comment = commit.commitComments[author];
        comment.text = _text;
        comment.author = author;
        comment.points = points;
        comment.creationDate = block.timestamp;
        comment.lastModificationDate = block.timestamp;

        if(root.checkCommitSeason(url, commit.author)) {
            uint256[] memory qualityArray;
            uint256[] memory complexityArray;
            uint256[] memory confidenceArray;
            quality = qualityArray;
            complexity = complexityArray;
            confidence = confidenceArray;
            for(uint256 i = 0; i < storedData[url].finishedComments.length; i++) {
                Comment memory reviewerComment = commit.commitComments[commit.finishedComments[i]];
                quality.push(reviewerComment.points[0]);
                complexity.push(reviewerComment.points[1]);
                confidence.push(reviewerComment.points[2]);
            }
            uint256 commitScore;
            uint256 commitComplexity;
            (commitScore, commitComplexity) = root.calculatePonderation(quality, complexity, confidence);
            commit.previousScore = commit.score;
            commit.previousComplexity = commit.weightedComplexity;
            commit.score = commitScore;
            commit.weightedComplexity = commitComplexity;
        }
        commit.isReadNeeded = true;
        commit.currentNumberReviews ++;
        commit.lastModificationDate = block.timestamp;
        //score per commit
        root.setReview(url, commit.author);
    }
    function setVote(bytes32 url, address user, uint256 vote) public onlyRoot {
        require(storedData[url].author == tx.origin, "Commit author is not sender");
        assert(vote == 1 || vote == 2 || vote == 3);
        require(storedData[url].commitComments[user].author == user, "Comment author is not user");
        storedData[url].commitComments[user].vote = vote;
    }
    function readCommit(bytes32 _url) public onlyRoot {
        if(storedData[_url].author == tx.origin){
            storedData[_url].isReadNeeded = false;
        }
    }
    function isCommit(bytes32 _url) public onlyRoot view returns(bool,bool){
        bool yes = false;
        bool auth = false;
        if(storedData[_url].author != address(0)){
            yes = true;
            if(storedData[_url].author == tx.origin){
                auth = true;
            }
        }
        return (yes,auth);
    }

    function getCommitScores(bytes32 url) public onlyAllowed view returns (uint256, uint256, uint256, uint256) {
        return(storedData[url].score, storedData[url].weightedComplexity, storedData[url].previousScore, storedData[url].previousComplexity);
    }

    function getCommitPendingReviewer(bytes32 url, uint reviewerIndex) public view returns (address) {
        return storedData[url].pendingComments[reviewerIndex];
    }

    function allowNewUser(address userAddress) public onlyRoot {
        allowedAddresses[userAddress] = true;
    }
}
