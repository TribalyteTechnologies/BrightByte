pragma solidity 0.4.21;
import "./Root.sol";

contract Commits {
    Root private root;
    address private rootAddress;
    uint constant finalDayMigrate = 1553122800;
    bytes32[] private allCommitsArray;
    mapping (bytes32 => Commit) private storedData;

    uint16[] quality;
    uint16[] confidence;
    uint16[] complexity;

    address private owner;

    struct Commit {
        string title;
        string url;
        address author;
        uint creationDate;
        bool isReadNeeded;
        uint lastModificationDate;
        uint numberReviews;
        uint currentNumberReviews;
        uint32 score;
        uint32 weightedComplexity;
        uint32 previousScore;
        uint32 previousComplexity;
        address[] pendingComments;
        address[] finishedComments;
        mapping (address => Comment) commitComments;
    }
    struct Comment{
        string text;
        address author;
        uint score;
        uint16[] points;
        uint vote; //0 => no vote, 1 => dont agree, 2 => agree
        uint creationDate;
        uint lastModificationDate;
    }
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function Commits() public {
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

    function setNewCommit (string _title, string _url, uint _users) public onlyDapp {
        address auth = tx.origin;
        address[] memory a;
        bytes32 _id = keccak256(_url);
        if(storedData[_id].author == address(0)){
            storedData[_id] = Commit(_title, _url, msg.sender, block.timestamp, false, block.timestamp,_users, 0, 0, 0, 0, 0, a,a);
            allCommitsArray.push(_id);
            if(msg.sender == tx.origin){
                root.setNewCommit(_id);
            }
        } else {
            require(storedData[_id].author == auth);
            storedData[_id].title = _title;
        }
    }
    function notifyCommit(bytes32 url,address a) public onlyRoot {
        require(storedData[url].author == tx.origin);
        bool saved = false;
        for(uint i = 0; i < storedData[url].pendingComments.length; i++){
            if(a == storedData[url].pendingComments[i]){
                saved = true;
                break;
            }
        }
        if(!saved){
            for(i = 0; i < storedData[url].finishedComments.length; i++){
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
    function getDetailsCommits(bytes32 _url) public onlyDapp view returns(string, string, address, uint, uint, bool, uint, uint, uint){
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
    function getCommitScore(bytes32 _id) public onlyDapp view returns(uint,uint){
        return(storedData[_id].score, storedData[_id].weightedComplexity);
    }
    function getNumbers() public onlyDapp view returns(uint){
        return allCommitsArray.length;
    }
    function getAllCommitsId(uint index) public onlyDapp view returns(bytes32){
        return allCommitsArray[index];
    }
    function getNumbersNeedUrl(bytes32 _url) public onlyDapp view returns (uint, uint){
        return (storedData[_url].pendingComments.length,
                storedData[_url].finishedComments.length
        );
    }
    function getCommentsOfCommit(bytes32 _url) public onlyDapp view returns(address[],address[]){
        return (
            storedData[_url].pendingComments,
            storedData[_url].finishedComments
        );
    }
    function getCommentDetail(bytes32 url, address a) public onlyDapp view returns(string,uint ,uint,uint,uint,address, uint16[]){
        Comment memory comment = storedData[url].commitComments[a];
        return(
            comment.text,
            comment.score,
            comment.vote,
            comment.creationDate,
            comment.lastModificationDate,
            comment.author,
            comment.points
        );
    }

    function setReview(string _url,string _text, uint16[] points) onlyDapp public{
        bytes32 url = keccak256(_url);
        address author = tx.origin;
        
        Commit storage commit = storedData[url];
        bool saved = false;
        for (uint8 j = 0;j < commit.pendingComments.length; j++){
            if (author == commit.pendingComments[j]){
                commit.pendingComments[j] = commit.pendingComments[commit.pendingComments.length-1];
                commit.pendingComments.length--;
                saved = true;
                break;
            }
        }
        require(saved);
        commit.finishedComments.push(author);
        Comment storage comment = commit.commitComments[author];
        comment.text = _text;
        comment.author = author;
        comment.points = points;
        comment.creationDate = block.timestamp;
        comment.lastModificationDate = block.timestamp;

        uint16[] memory qualityArray;
        uint16[] memory complexityArray;
        uint16[] memory confidenceArray;
        quality = qualityArray;
        complexity = complexityArray;
        confidence = confidenceArray;
        for(uint8 i = 0; i < storedData[url].finishedComments.length; i++) {
            quality.push(commit.commitComments[commit.finishedComments[i]].points[0]);
            complexity.push(commit.commitComments[commit.finishedComments[i]].points[1]);
            confidence.push(commit.commitComments[commit.finishedComments[i]].points[2]);
        }
        uint32 commitScore;
        uint32 commitComplexity;
        (commitScore, commitComplexity) = root.calculatePonderation(quality, complexity, confidence);
        commit.previousScore = commit.score;
        commit.previousComplexity = commit.weightedComplexity;
        commit.score = commitScore;
        commit.weightedComplexity = commitComplexity;
        commit.isReadNeeded = true;
        commit.currentNumberReviews ++;
        commit.lastModificationDate = block.timestamp;
        //score per commit
        root.setReview(url, commit.author);
    }
    function setVote(bytes32 url, address user, uint8 vote) public onlyRoot {
        require(storedData[url].author == tx.origin);
        assert(vote == 1 || vote == 2);
        require(storedData[url].commitComments[user].author == user);
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

    function setAllCommitData(string tit,string url,address ath,uint crDt,bool need,uint lt,uint rev,uint ctR, uint32 sc, uint p) public onlyDapp {
        bytes32 _id = keccak256(url);
        address[] memory a;
        require (bytes(storedData[_id].url).length == 0 && bytes(storedData[_id].title).length == 0);
        storedData[_id] = Commit(tit, url, msg.sender, crDt, need, lt, rev, ctR, sc, 0, 0, 0, a, a);
        allCommitsArray.push(_id);
    }

    function setAllCommitDataTwo(bytes32 _url, address[] pdCom, address[] fnCom) public onlyDapp {
        Commit storage data = storedData[_url];
        for(uint i = 0; i < pdCom.length; i++) {
            data.pendingComments.push(pdCom[i]);
        }
        for(uint j = 0; j < fnCom.length; j++) {
            data.finishedComments.push(fnCom[j]);
        }
    }

    function setAllCommentData(bytes32 url,address user,string txt,address ath,uint sc, uint16[] points, uint v, uint crDt, uint lsMd) public onlyDapp {
        Comment storage data = storedData[url].commitComments[user];
        data.text = txt;
        data.author = ath;
        data.score = sc;
        data.vote = v;
        data.creationDate = crDt;
        data.lastModificationDate = lsMd;
        for(uint i = 0; i < points.length; i++) {
            data.points.push(points[i]);
        }
    }

    function setPendingCommentsData(bytes32 url, address hash)  public onlyDapp {
        bool found = false;
        for (uint i = 0; i < storedData[url].pendingComments.length; i++){
            if(storedData[url].pendingComments[i] == hash){
                found = true;
                break;
            }
        }
        if(!found){
            storedData[url].pendingComments.push(hash);
        }
    }

    function getCommitScores(bytes32 url) public onlyDapp view returns (uint32, uint32, uint32, uint32) {
        return(storedData[url].score, storedData[url].weightedComplexity, storedData[url].previousScore, storedData[url].previousComplexity);
    }
}
