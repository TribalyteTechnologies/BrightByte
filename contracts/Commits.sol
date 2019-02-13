pragma solidity 0.4.21;
import "./Root.sol";

contract Commits {
    Root private root;
    address private rootAddress;
    uint constant finalDayMigrate = 1548028800;
    bytes32[] private allCommitsArray;
    mapping (bytes32 => Commit) private storedData;

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
        uint score;
        uint points;
        address[] pendingComments;
        address[] finishedComments;
        mapping (address => Comment) commitComments;
    }
    struct Comment{
        string text;
        address author;
        uint score;
        uint256[] points;
        uint vote; //0 => no vote, 1 => dont agree, 2 => agree
        uint creationDate;
        uint lastModificationDate;
        bool isReadNeeded;
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
            storedData[_id] = Commit(_title, _url, msg.sender, block.timestamp, false, block.timestamp,_users, 0, 0, 0, a,a);
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
        return(storedData[_id].score,storedData[_id].points);
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
    function getCommentDetail(bytes32 url, address a) public onlyDapp view returns(string,uint ,uint,uint,uint,address){
        Comment memory comment = storedData[url].commitComments[a];
        return(
            comment.text,
            comment.score,
            comment.vote,
            comment.creationDate,
            comment.lastModificationDate,
            comment.author
        );
    }
    function getCommentPoints(bytes32 url, address a) public onlyDapp view returns(uint256[]){
        return storedData[url].commitComments[a].points;
    }
    function setReview(string _url,string _text, uint256[] points) onlyDapp public{
        bytes32 url = keccak256(_url);
        address author = tx.origin;

        bool saved = false;
        for (uint j = 0;j < storedData[url].pendingComments.length; j++){
            if (author == storedData[url].pendingComments[j]){
                storedData[url].pendingComments[j] = storedData[url].pendingComments[storedData[url].pendingComments.length-1];
                storedData[url].pendingComments.length--;
                saved = true;
                break;
            }
        }
        require(saved);
        storedData[url].finishedComments.push(author);
        Comment storage comment = storedData[url].commitComments[author];
        uint256 calculatedPoints = root.calculatePonderation(points);
        comment.text = _text;
        comment.author = author;
        comment.score = calculatedPoints/100;
        comment.points = points;
        comment.creationDate = block.timestamp;
        comment.lastModificationDate = block.timestamp;

        storedData[url].isReadNeeded = true;
        storedData[url].currentNumberReviews ++;
        storedData[url].lastModificationDate = block.timestamp;
        //score per commit
        
        uint commitPoints = storedData[url].points;
        storedData[url].points = commitPoints + calculatedPoints;
        storedData[url].score = storedData[url].points/storedData[url].finishedComments.length;
        root.setReview(url,storedData[url].author,calculatedPoints);
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
        } else if (storedData[_url].commitComments[tx.origin].author == tx.origin){
            storedData[_url].commitComments[tx.origin].isReadNeeded = false;
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

    function setAllCommitData(string tit,string url,address ath,uint crDt,bool need,uint lt,uint rev,uint ctR, uint sc, uint p) public onlyDapp {
        bytes32 _id = keccak256(url);
        address[] memory a;
        require (bytes(storedData[_id].url).length == 0 && bytes(storedData[_id].title).length == 0);
        storedData[_id] = Commit(tit, url, msg.sender, crDt, need, lt, rev, ctR, sc, p, a, a);
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

    function setAllCommentData(bytes32 url,address user,string txt,address ath,uint sc, uint v, uint crDt, uint lsMd) public onlyDapp {
        Comment storage data = storedData[url].commitComments[user];
        data.text = txt;
        data.author = ath;
        data.score = sc;
        data.vote = v;
        data.creationDate = crDt;
        data.lastModificationDate = lsMd;
    }

    function setPendingCommentsData(bytes32 _url, address _hash)  public onlyDapp {
        bool found = false;
        for (uint i = 0; i < storedData[_url].pendingComments.length; i++){
            if(storedData[_url].pendingComments[i] == _hash){
                found = true;
                break;
            }
        }
        if(!found){
            storedData[_url].pendingComments.push(_hash);
        }
    }
}
